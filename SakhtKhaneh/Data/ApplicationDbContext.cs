using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Models;
using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Journals;
using SakhtKhaneh.Models.Messages;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Template;

namespace SakhtKhaneh.Data;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public DbSet<Visit> Visits => Set<Visit>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectGalleryItem> GalleryItems => Set<ProjectGalleryItem>();
    public DbSet<ProjectCategory> ProjectCategories => Set<ProjectCategory>();
    public DbSet<BlogCategory> BlogCategories => Set<BlogCategory>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<SakhtKhaneh.Models.Services.Service> Services => Set<SakhtKhaneh.Models.Services.Service>();
    public DbSet<TemplatesProperty> TemplatesProperties => Set<TemplatesProperty>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Journal> Journals => Set<Journal>();
    public DbSet<JournalGalleryItem> JournalGalleryItems => Set<JournalGalleryItem>();
    public DbSet<SocialLink> SocialLinks => Set<SocialLink>();

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Visit>(entity =>
        {
            entity.ToTable("Visits");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Time);
            entity.HasIndex(p => p.Path);
        });

        modelBuilder.Entity<TemplatesProperty>(entity =>
        {
            entity.ToTable("TemplateProperties");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.Path, p.Key });
        });

        modelBuilder.Entity<SakhtKhaneh.Models.Services.Service>(entity =>
        {
            entity.ToTable("Services");
            entity.HasKey(p => p.Id);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("Projects");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Endpoint_Path);
            entity.HasMany(p => p.Gallery)
                .WithOne()
                .HasForeignKey(g => g.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.Category)
                .WithMany(c => c.Projects)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(p => p.Status).HasConversion<int>();
        });


        modelBuilder.Entity<ProjectCategory>(entity =>
        {
            entity.ToTable("ProjectCategories");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => new { p.ParentId, p.SortOrder });
            entity.Property(p => p.Title).HasMaxLength(180);
            entity.Property(p => p.Slug).HasMaxLength(180);
            entity.HasOne(p => p.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(p => p.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectGalleryItem>(entity =>
        {
            entity.ToTable("ProjectsGalleryItems");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.ProjectId);
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.ToTable("BlogPosts");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.EndpointPath);
            entity.HasIndex(p => p.CreationDate);
            entity.HasOne(p => p.Category)
                .WithMany()
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BlogCategory>(entity =>
        {
            entity.ToTable("BlogCategories");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => new { p.ParentId, p.SortOrder });
            entity.Property(p => p.Title).HasMaxLength(180);
            entity.Property(p => p.Slug).HasMaxLength(180);
            entity.HasOne(p => p.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(p => p.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        modelBuilder.Entity<SocialLink>(entity =>
        {
            entity.ToTable("SocialLinks");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.IsVisible, p.SortOrder });
            entity.Property(p => p.Platform).HasMaxLength(80);
            entity.Property(p => p.Title).HasMaxLength(120);
            entity.Property(p => p.Url).HasMaxLength(1000);
            entity.Property(p => p.Username).HasMaxLength(250);
            entity.Property(p => p.IconName).HasMaxLength(80);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("Messages");
            entity.HasKey(p => p.Id);
        });

        modelBuilder.Entity<Journal>(entity =>
        {
            entity.ToTable("Journals");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.EndpointPath).IsUnique();
            entity.HasIndex(p => new { p.IsPublished, p.CreationDate });
            entity.Property(p => p.Title).HasMaxLength(250);
            entity.Property(p => p.EndpointPath).HasMaxLength(180);
            entity.Property(p => p.Author).HasMaxLength(150);
            entity.HasMany(p => p.Gallery)
                .WithOne()
                .HasForeignKey(p => p.JournalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JournalGalleryItem>(entity =>
        {
            entity.ToTable("JournalGalleryItems");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.JournalId, p.SortOrder });
            entity.Property(p => p.ImageUrl).HasMaxLength(1000);
            entity.Property(p => p.ImageAlt).HasMaxLength(250);
        });
    }
}
