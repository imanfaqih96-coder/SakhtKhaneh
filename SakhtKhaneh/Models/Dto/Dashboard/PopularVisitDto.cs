namespace SakhtKhaneh.Models.Dto.Dashboard
{
    public class PopularVisitDto
    {
        public int Count { get; set; }
        public string Path { get; set;  }
        public string Type { get; set; }
        public string? Param { get; set; }
        public DateTime LastVisit { get; set; }
    }
}
