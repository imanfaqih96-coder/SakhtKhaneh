using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Models.GeoLocation;

namespace SakhtKhaneh.Models
{
    public class VisitRecord
    {
        public string path { get; set; }
        public string pathType { get; set; }
        public string? pathParam { get; set; }
        public Geo geolocation { get; set; }
    }

    public class Visit
    {
        public Guid Id { get; set; }
        public DateTime Time { get; set; }
        public string Path { get; set; }
        public string PathType { get; set; }
        public string? PathParam { get; set; }
        public string Ip { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string StateCode { get; set; }
        public string Country { get; set; } 
        public string CountryCode { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set;  }
        
    }
}
