using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Build.Evaluation;
using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Models;
using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Projects;

namespace SakhtKhaneh.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser>
    {
        public DbSet<Visit> Visits { get; set; }
        public DbSet<SakhtKhaneh.Models.Projects.Project> Projects { get; set; }
        public DbSet<SakhtKhaneh.Models.Projects.ProjectGalleryItem> GalleryItems { get; set; }
        public DbSet<SakhtKhaneh.Models.Blog.BlogCategory> BlogCategories { get; set; }
        public DbSet<SakhtKhaneh.Models.Blog.BlogPost> BlogPosts { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)

        {
            // ⚠ REQUIRED for Identity to work properly
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Visit>(entity =>
            {
                entity.ToTable("Visits");
                entity.HasKey(p => p.Id);
            });

            modelBuilder.Entity<SakhtKhaneh.Models.Projects.Project>(entity =>
            {
                entity.ToTable("Projects");
                entity.HasKey(p => p.Id);
                entity.HasMany(p => p.Gallery)
                        .WithOne()
                        .HasForeignKey(g => g.ProjectId)
                        .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.ToTable("BlogPosts");
                entity.HasKey(p => p.Id);

                entity.HasOne(p => p.Category)
                      .WithMany()                                  // هر Category می‌تواند n پست داشته باشد
                      .HasForeignKey(p => p.CategoryId)            // FK در BlogPost است
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BlogCategory>(entity =>
            {
                entity.ToTable("BlogCategories");
                entity.HasKey(p => p.Id);
            });


            modelBuilder.Entity<SakhtKhaneh.Models.Projects.ProjectGalleryItem>(entity =>
            {
                entity.ToTable("ProjectsGalleryItems");
                entity.HasKey(p => p.Id);
            });
        }
    }
}
