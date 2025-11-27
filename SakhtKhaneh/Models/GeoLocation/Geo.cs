namespace SakhtKhaneh.Models.GeoLocation
{
    public class Geo
    {
        public string ip { get; set; }
        public GeoLocation location { get; set; }
        public GeoCountryMetadata country_metadata { get; set; }
        public GeoCurrency currency { get; set; }
    }

    public class GeoCountryMetadata
    {
        public string calling_code { get; set; }
        public string tld { get; set; }
        public List<string> languages { get; set; }
    }

    public class GeoCurrency
    {
        public string code { get; set; }
        public string name { get; set; }
        public string symbol { get; set; }
    }

    public class GeoLocation
    {
        public string continent_code { get; set; }
        public string continent_name { get; set; }
        public string country_code2 { get; set; }
        public string country_code3 { get; set; }
        public string country_name { get; set; }
        public string country_name_official { get; set; }
        public string country_capital { get; set; }
        public string state_prov { get; set; }
        public string state_code { get; set; }
        public string district { get; set; }
        public string city { get; set; }
        public string zipcode { get; set; }
        public string latitude { get; set; }
        public string longitude { get; set; }
        public bool is_eu { get; set; }
        public string country_flag { get; set; }
        public string geoname_id { get; set; }
        public string country_emoji { get; set; }
    }
}
