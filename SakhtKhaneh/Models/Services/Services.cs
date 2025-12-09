namespace SakhtKhaneh.Models.Services
{
    public class Service
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string IconUrl { get; set; }
        public string Description { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? LastUpdateDate { get; set; }
    }

    public class ServiceCoreDto
    {
        public Guid? id { get; set; }
        public string? title { get; set; }
        public string? iconUrl { get; set; }
        public string? description { get; set; }
        public DateTime? creationDate { get; set; }
        public DateTime? lastUpdateDate { get; set; }
    }
}