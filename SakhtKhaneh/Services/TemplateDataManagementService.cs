using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Template.ViewModels;
using System;

namespace SakhtKhaneh.Services
{
    public class TemplateDataManagementService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public TemplateDataManagementService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task<List<SliderItem>> GetSliderItems()
        {
            List<SliderItem> result = new List<SliderItem>();

            using (var scope = _scopeFactory.CreateScope())
            {

                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                try
                {
                    var items = await _context.TemplatesProperties.Where(p => p.Path == "home" && p.Key == "slider-item").ToListAsync();

                    foreach (var item in items)
                    {
                        result.Add(new SliderItem { ImageUrl = item.Value });
                    }

                }
                catch (Exception ex)
                {
                    var error = ex.Message;
                }

            }

            return result;
        }

        public async Task<AboutSectionInfoViewModel> GetAboutSectionInfo()
        {
            AboutSectionInfoViewModel result = new AboutSectionInfoViewModel();

            using (var scope = _scopeFactory.CreateScope())
            {

                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var titleRow = await _context.TemplatesProperties.Where(p => p.Path == "about" && p.Key == "title").FirstOrDefaultAsync();
                var title = titleRow.Value;

                result.title = title;

                var contentRow = await _context.TemplatesProperties.Where(p => p.Path == "about" && p.Key == "content").FirstOrDefaultAsync();
                var content = contentRow.Value;

                result.content = content;

                var imageRow = await _context.TemplatesProperties.Where(p => p.Path == "about" && p.Key == "image").FirstOrDefaultAsync();
                var image = imageRow.Value;

                result.imageUrl = image;

            }

            return result;
        }

        public async Task<List<Project>> GetHomeViewProjects()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var projects = await _context.Projects.OrderByDescending(p=>p.StartDate).ToListAsync();
                projects = projects.Take(4).ToList();
                return projects;
            }
        }
    }
}
