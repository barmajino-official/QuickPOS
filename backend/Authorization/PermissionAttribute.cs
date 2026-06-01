using System.IdentityModel.Tokens.Jwt;
using App.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace App.Authorization;

/// <summary>
/// Requires the authenticated staff member to currently hold at least ONE of the
/// given permission keys. Permissions are read fresh from the database on every
/// request, so an admin's change takes effect on the user's next request — no
/// re-login required. Returns 403 Forbidden (with a message) when not allowed.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class PermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _anyOf;

    public PermissionAttribute(params string[] anyOf) => _anyOf = anyOf;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var sub = context.HttpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var staff = await db.Staff.AsNoTracking().FirstOrDefaultAsync(s => s.Id == userId);
        if (staff is null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var allowed = _anyOf.Any(key => staff.Permissions.TryGetValue(key, out var v) && v);
        if (!allowed)
        {
            context.Result = new ObjectResult(new { message = "You do not have permission to perform this action." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
        }
    }
}
