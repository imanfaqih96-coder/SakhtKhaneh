namespace SakhtKhaneh.Models.Template
{
    public class TemplatesProperty
    {
        public Guid Id { get; set; }
        public string Path { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? LastUpadteDate { get; set; }
    }

    public class TemplatesPropertyCoreDto
    {
        public Guid? id { get; set; }
        public string path { get; set; }
        public string key { get; set; }
        public string? value { get; set; }
        public DateTime? creationDate { get; set; }
        public DateTime? lastUpadteDate { get; set; }
    }

    public class IconItem
    {
        public string title { get; set; }
        public string iconUrl { get; set; }
    }

}
