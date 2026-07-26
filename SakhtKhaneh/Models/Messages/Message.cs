namespace SakhtKhaneh.Models.Messages
{
    public class Message
    {
        public Guid Id { get; set; }
        public string Name { get; set;  }
        public string   Email { get; set; }
        public string Phone { get; set; }
        public string? Subject { get; set; }
        public string Content { get; set;  }
    }

    public class MessageDto
    {
        public string name { get; set; }
        public string email { get; set; }
        public string phone { get; set; }
        public string? subject { get; set; }
        public string content { get; set; }
    }
}
