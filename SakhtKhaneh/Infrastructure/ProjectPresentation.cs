using SakhtKhaneh.Models.Projects;

namespace SakhtKhaneh.Infrastructure;

public static class ProjectPresentation
{
    public static string StatusTitle(ProjectStatus status) => status switch
    {
        ProjectStatus.InDesign => "در دست طراحی",
        ProjectStatus.UnderConstruction => "در دست ساخت",
        ProjectStatus.Completed => "تکمیل‌شده",
        _ => "نامشخص"
    };

    public static string StatusCss(ProjectStatus status) => status switch
    {
        ProjectStatus.InDesign => "sk-project-status--design",
        ProjectStatus.UnderConstruction => "sk-project-status--building",
        ProjectStatus.Completed => "sk-project-status--completed",
        _ => "sk-project-status--unknown"
    };
}
