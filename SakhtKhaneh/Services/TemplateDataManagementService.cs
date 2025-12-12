using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template.ViewModels;
using System;

namespace SakhtKhaneh.Services
{
    public class TemplateDataManagementService : ITemplateDataManagementService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public TemplateDataManagementService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        // Layout Data

        public async Task<List<TemplateMenuItem>?> GetMainMenuItems()
        {
            var menus = new List<TemplateMenuItem>();

            menus.Add(new TemplateMenuItem
            {
                Path = "/Public/Index",
                Title = "صفحه اصلی",
                Children = null
            });

            menus.Add(new TemplateMenuItem
            {
                Path = "/Projects",
                Title = "پروژه ها",
                Children = null
            });

            menus.Add(new TemplateMenuItem
            {
                Path = "/Blog",
                Title = "بلاگ",
                Children = null
            });

            menus.Add(new TemplateMenuItem
            {
                Path = "/Public/Contacts",
                Title = "تماس با ما",
                Children = null
            });

            menus.Add(new TemplateMenuItem
            {
                Path = "/Public/About",
                Title = "درباره ما",
                Children = null
            });

            return menus;
        }
        public async Task<string> GetTemplateField(string pathName, string fieldName)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var row = await _context.TemplatesProperties.Where(p => p.Path == pathName && p.Key == fieldName).FirstOrDefaultAsync();

                if (row != null)
                {
                    return row.Value;
                }
                else
                {
                    return string.Empty;
                }
            }
        }
        public async Task<ContactDataViewModel> GetContacts()
        {
            var description = await GetTemplateField("contacts", "description");
            var content = await GetTemplateField("contacts", "content");
            var phone = await GetTemplateField("contacts", "phone");
            var email = await GetTemplateField("contacts", "email");
            var address = await GetTemplateField("contacts", "address");

            var data = new ContactDataViewModel
            {
                Description = description,
                Content = content,
                Phone = phone,
                Email = email,
                Address = address
            };

            return data;
        }

        // Home Data 
        public async Task<List<SliderItem>?> GetSliderItems()
        {
            try
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
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<AboutSectionInfoViewModel?> GetAboutSectionInfo()
        {
            try
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
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<List<Project>> GetHomeViewProjects()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var projects = await _context.Projects.OrderByDescending(p => p.StartDate).ToListAsync();
                projects = projects.Take(4).ToList();
                return projects;
            }
        }
        public async Task<List<Service>?> GetHomeServices()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var services = await _context.Services.ToListAsync();
                if (services != null && services.Count >= 3)
                {
                    return services.Take(3).ToList();
                }
                else
                {
                    return services;
                }
            }
        }
        public async Task<List<BlogPost>?> GetHomePosts()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var posts = await _context.BlogPosts.Include(p => p.Category).ToListAsync();
                if (posts != null && posts.Count >= 3)
                {
                    return posts.Take(3).ToList();
                }
                else
                {
                    return posts;
                }
            }
        }
        public async Task<HomeDataViewModel> GetHomeData()
        {
            var sliderItems = await GetSliderItems();

            var aboutInfo = await GetAboutSectionInfo();

            var homeProjects = await GetHomeViewProjects();

            var services = await GetHomeServices();

            var posts = await GetHomePosts();

            var model = new HomeDataViewModel
            {
                Slider = sliderItems,
                AboutInfo = aboutInfo,
                Projects = homeProjects,
                Services = services,
                Posts = posts
            };

            return model;
        }

        // Other

        public async Task<List<BlogPost>?> GetBlogGridPosts()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var posts = await _context.BlogPosts.Include(p => p.Category).ToListAsync();
                return posts;
            }
        }
        public async Task<BlogPost?> GetSingleBlogItem(string pathName)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var target = await _context.BlogPosts.Where(p => p.EndpointPath.ToLower() == pathName.ToLower()).FirstOrDefaultAsync();
                return target;
            }
        }
        public async Task<List<Project>?> GetProjectsGridItems()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var projects = await _context.Projects.Include(p => p.Gallery).ToListAsync();
                return projects;
            }
        }
        public async Task<Project?> GetSingleProjectItem(string pathName)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var project = await _context.Projects.Where(p => p.Endpoint_Path.ToLower() == pathName.ToLower()).FirstOrDefaultAsync();
                return project;
            }
        }
    }
}