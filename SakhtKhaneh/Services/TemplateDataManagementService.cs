using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Journals;
using SakhtKhaneh.Models.Messages;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template.ViewModels;

namespace SakhtKhaneh.Services;

public sealed class TemplateDataManagementService : ITemplateDataManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TemplateDataManagementService> _logger;

    public TemplateDataManagementService(
        ApplicationDbContext context,
        ILogger<TemplateDataManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<TemplateMenuItem>> GetMainMenuItems()
    {
        var categoryRows = await _context.ProjectCategories
            .AsNoTracking()
            .Where(item => item.IsVisible)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new { item.Id, item.ParentId, item.Title, item.Slug })
            .ToListAsync();

        var lookup = categoryRows.ToDictionary(
            item => item.Id,
            item => new TemplateMenuItem
            {
                Path = $"/Projects/Category/{item.Slug}",
                Title = item.Title,
                Children = new List<TemplateMenuItem>()
            });

        foreach (var row in categoryRows)
        {
            if (row.ParentId.HasValue && lookup.TryGetValue(row.ParentId.Value, out var parent))
                parent.Children!.Add(lookup[row.Id]);
        }

        var projectRoot = new TemplateMenuItem
        {
            Path = "/Projects",
            Title = "پروژه‌ها",
            Children = categoryRows.Where(item => !item.ParentId.HasValue).Select(item => lookup[item.Id]).ToList()
        };

        return new List<TemplateMenuItem>
        {
            new() { Path = "/", Title = "صفحه اصلی" },
            projectRoot,
            new() { Path = "/Blog", Title = "بلاگ" },
            new() { Path = "/Journals", Title = "ژورنال‌ها" },
            new() { Path = "/Services", Title = "خدمات ما" },
            new() { Path = "/Public/Contacts", Title = "تماس با ما" },
            new() { Path = "/Public/About", Title = "درباره ما" }
        };
    }

    public async Task<string> GetTemplateField(string pathName, string fieldName)
    {
        return await _context.TemplatesProperties
                   .AsNoTracking()
                   .Where(item => item.Path == pathName && item.Key == fieldName)
                   .Select(item => item.Value)
                   .FirstOrDefaultAsync()
               ?? string.Empty;
    }

    public async Task<ContactDataViewModel> GetContacts()
    {
        var rows = await _context.TemplatesProperties
            .AsNoTracking()
            .Where(item => item.Path == "contacts")
            .ToDictionaryAsync(item => item.Key, item => item.Value);

        return new ContactDataViewModel
        {
            Description = rows.GetValueOrDefault("description", string.Empty),
            Content = rows.GetValueOrDefault("content", string.Empty),
            Phone = rows.GetValueOrDefault("phone", string.Empty),
            Email = rows.GetValueOrDefault("email", string.Empty),
            Address = rows.GetValueOrDefault("address", string.Empty),
            SocialLinks = await _context.SocialLinks.AsNoTracking()
                .Where(item => item.IsVisible)
                .OrderBy(item => item.SortOrder)
                .ThenBy(item => item.Title)
                .ToListAsync(),
            ProjectCategories = await BuildProjectMenuRootsAsync()
        };
    }

    private async Task<List<TemplateMenuItem>> BuildProjectMenuRootsAsync()
    {
        var rows = await _context.ProjectCategories.AsNoTracking()
            .Where(item => item.IsVisible)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new { item.Id, item.ParentId, item.Title, item.Slug })
            .ToListAsync();
        var lookup = rows.ToDictionary(item => item.Id, item => new TemplateMenuItem
        {
            Title = item.Title,
            Path = $"/Projects/Category/{item.Slug}",
            Children = new List<TemplateMenuItem>()
        });
        foreach (var row in rows)
            if (row.ParentId.HasValue && lookup.TryGetValue(row.ParentId.Value, out var parent)) parent.Children!.Add(lookup[row.Id]);
        return rows.Where(item => !item.ParentId.HasValue).Select(item => lookup[item.Id]).ToList();
    }

    public async Task<List<SliderItem>> GetSliderItems()
    {
        return await _context.TemplatesProperties
            .AsNoTracking()
            .Where(item => item.Path == "home" && item.Key == "slider-item")
            .OrderBy(item => item.CreationDate)
            .Select(item => new SliderItem { ImageUrl = item.Value })
            .ToListAsync();
    }

    public async Task<AboutSectionInfoViewModel?> GetAboutSectionInfo()
    {
        var rows = await _context.TemplatesProperties
            .AsNoTracking()
            .Where(item => item.Path == "about")
            .ToDictionaryAsync(item => item.Key, item => item.Value);

        if (rows.Count == 0)
            return null;

        return new AboutSectionInfoViewModel
        {
            title = rows.GetValueOrDefault("title", string.Empty),
            content = rows.GetValueOrDefault("content", string.Empty),
            imageUrl = rows.GetValueOrDefault("image", string.Empty)
        };
    }

    public Task<List<Project>> GetHomeViewProjects()
    {
        return _context.Projects
            .AsNoTracking()
            .Include(item => item.Category)
            .OrderByDescending(item => item.Time)
            .Take(4)
            .ToListAsync();
    }

    public Task<List<Service>> GetHomeServices()
    {
        return _context.Services
            .AsNoTracking()
            .OrderBy(item => item.CreationDate)
            .Take(3)
            .ToListAsync();
    }

    public Task<List<BlogPost>> GetHomePosts()
    {
        return _context.BlogPosts
            .AsNoTracking()
            .Include(item => item.Category)
            .OrderByDescending(item => item.CreationDate)
            .Take(3)
            .ToListAsync();
    }

    public Task<List<Journal>> GetHomeJournals()
    {
        return _context.Journals
            .AsNoTracking()
            .Include(item => item.Gallery.OrderBy(image => image.SortOrder))
            .Where(item => item.IsPublished)
            .OrderByDescending(item => item.CreationDate)
            .Take(4)
            .ToListAsync();
    }

    public async Task<HomeDataViewModel> GetHomeData()
    {
        // ApplicationDbContext is scoped and must not execute concurrent queries.
        return new HomeDataViewModel
        {
            Slider = await GetSliderItems(),
            AboutInfo = await GetAboutSectionInfo(),
            Projects = await GetHomeViewProjects(),
            Services = await GetHomeServices(),
            Posts = await GetHomePosts(),
            Journals = await GetHomeJournals()
        };
    }

    public Task<List<BlogPost>> GetBlogGridPosts()
    {
        return _context.BlogPosts
            .AsNoTracking()
            .Include(item => item.Category)
            .OrderByDescending(item => item.CreationDate)
            .ToListAsync();
    }

    public Task<BlogPost?> GetSingleBlogItem(string pathName)
    {
        return _context.BlogPosts
            .AsNoTracking()
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.EndpointPath.ToLower() == pathName.ToLower());
    }

    public async Task<BlogCategoryPageViewModel?> GetBlogPostsByCategory(string slug)
    {
        var category = await _context.BlogCategories.AsNoTracking()
            .FirstOrDefaultAsync(item => item.IsVisible && item.Slug.ToLower() == slug.ToLower());
        if (category is null) return null;

        var categories = await _context.BlogCategories.AsNoTracking().ToListAsync();
        var ids = CollectBlogCategoryIds(category.Id, categories);
        return new BlogCategoryPageViewModel
        {
            Category = category,
            Posts = await _context.BlogPosts.AsNoTracking()
                .Include(item => item.Category)
                .Where(item => ids.Contains(item.CategoryId))
                .OrderByDescending(item => item.CreationDate)
                .ToListAsync()
        };
    }

    public Task<List<Project>> GetProjectsGridItems()
    {
        return _context.Projects
            .AsNoTracking()
            .Include(item => item.Gallery)
            .Include(item => item.Category)
            .OrderByDescending(item => item.Time)
            .ToListAsync();
    }

    public Task<Project?> GetSingleProjectItem(string pathName)
    {
        return _context.Projects
            .AsNoTracking()
            .Include(item => item.Gallery)
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Endpoint_Path.ToLower() == pathName.ToLower());
    }

    public async Task<ProjectCategoryPageViewModel?> GetProjectsByCategory(string slug)
    {
        var category = await _context.ProjectCategories.AsNoTracking()
            .FirstOrDefaultAsync(item => item.IsVisible && item.Slug.ToLower() == slug.ToLower());
        if (category is null) return null;

        var categories = await _context.ProjectCategories.AsNoTracking().ToListAsync();
        var ids = CollectProjectCategoryIds(category.Id, categories);
        return new ProjectCategoryPageViewModel
        {
            Category = new ProjectCategoryDto
            {
                Id = category.Id,
                ParentId = category.ParentId,
                Title = category.Title,
                Slug = category.Slug,
                SortOrder = category.SortOrder,
                IsVisible = category.IsVisible
            },
            Projects = await _context.Projects.AsNoTracking()
                .Include(item => item.Gallery)
                .Include(item => item.Category)
                .Where(item => item.CategoryId.HasValue && ids.Contains(item.CategoryId.Value))
                .OrderByDescending(item => item.Time)
                .ToListAsync()
        };
    }

    public Task<List<Journal>> GetJournalGridItems()
    {
        return _context.Journals
            .AsNoTracking()
            .Include(item => item.Gallery.OrderBy(image => image.SortOrder))
            .Where(item => item.IsPublished)
            .OrderByDescending(item => item.CreationDate)
            .ToListAsync();
    }

    public Task<Journal?> GetSingleJournalItem(string pathName)
    {
        return _context.Journals
            .AsNoTracking()
            .Include(item => item.Gallery.OrderBy(image => image.SortOrder))
            .FirstOrDefaultAsync(item => item.IsPublished && item.EndpointPath.ToLower() == pathName.ToLower());
    }

    public Task<List<Service>> GetServices()
    {
        return _context.Services
            .AsNoTracking()
            .OrderBy(item => item.CreationDate)
            .ToListAsync();
    }

    private static HashSet<Guid> CollectProjectCategoryIds(Guid rootId, IReadOnlyCollection<ProjectCategory> categories)
    {
        var result = new HashSet<Guid> { rootId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootId);
        while (queue.Count > 0)
        {
            var parent = queue.Dequeue();
            foreach (var child in categories.Where(item => item.ParentId == parent))
                if (result.Add(child.Id)) queue.Enqueue(child.Id);
        }
        return result;
    }

    private static HashSet<int> CollectBlogCategoryIds(int rootId, IReadOnlyCollection<BlogCategory> categories)
    {
        var result = new HashSet<int> { rootId };
        var queue = new Queue<int>();
        queue.Enqueue(rootId);
        while (queue.Count > 0)
        {
            var parent = queue.Dequeue();
            foreach (var child in categories.Where(item => item.ParentId == parent))
                if (result.Add(child.Id)) queue.Enqueue(child.Id);
        }
        return result;
    }

    public async Task<bool> SendMessageForContacts(MessageDto data)
    {
        try
        {
            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid(),
                Name = data.name,
                Email = data.email,
                Phone = data.phone,
                Subject = data.subject,
                Content = data.content
            });

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Saving contact message failed.");
            return false;
        }
    }
}
