namespace SakhtKhaneh.Models.Dto.Journals;

public class JournalCoreDto
{
    public Guid? Id { get; set; }
    public string EndpointPath { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Kept for API compatibility with V5 clients. The first gallery item becomes the cover.
    public string ImageUrl { get; set; } = string.Empty;
    public string? ImageAlt { get; set; }

    public string? Tags { get; set; }
    public bool IsPublished { get; set; } = true;
    public List<JournalGalleryItemDto> Gallery { get; set; } = new();
}

public class JournalGalleryItemDto
{
    public string Url { get; set; } = string.Empty;
    public string? Alt { get; set; }
    public int SortOrder { get; set; }
}
