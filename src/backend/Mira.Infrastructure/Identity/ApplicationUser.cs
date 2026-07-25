using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace Mira.Infrastructure.Identity
{
    public sealed class ApplicationUser : IdentityUser<Guid>
    {
    }
}
