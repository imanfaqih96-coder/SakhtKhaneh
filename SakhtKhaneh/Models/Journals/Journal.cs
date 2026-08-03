namespace SakhtKhaneh.Models.Journals;

public class Journal
{
    public Guid Id { get; set; }
    public string EndpointPath { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Backward-compatible cover fields. Existing journal rows remain valid.
    public string ImageUrl { get; set; } = string.Empty;
    public string ImageAlt { get; set; } = string.Empty;

    public string? Tags { get; set; }
    public string Author { get; set; } = "حسین کنعانی";
    public DateTime CreationDate { get; set; }
    public DateTime? LastUpdateDate { get; set; }
    public bool IsPublished { get; set; } = true;

    public List<JournalGalleryItem> Gallery { get; set; } = new();
}

public class JournalGalleryItem
{
    public Guid Id { get; set; }
    public Guid JournalId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ImageAlt { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
