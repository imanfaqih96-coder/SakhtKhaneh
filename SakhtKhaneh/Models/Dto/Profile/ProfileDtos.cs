namespace SakhtKhaneh.Models.Dto.Profile
{
    public class ProfileDtos
    {

    }

    public class UpdateProfileDto
    {
        public string UserName { get; set;  }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
