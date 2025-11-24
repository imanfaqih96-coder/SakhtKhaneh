using Microsoft.AspNetCore.Identity;

namespace SakhtKhaneh.Models
{
    public class AppUser : IdentityUser
    {
        public bool AdministrativeApproval { get; set;  }
    }
}
