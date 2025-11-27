using Microsoft.AspNetCore.Mvc;

namespace SakhtKhaneh.Controllers
{
    public class PublicController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
