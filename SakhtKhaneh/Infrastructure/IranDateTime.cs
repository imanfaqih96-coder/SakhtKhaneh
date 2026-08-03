using System.Globalization;
using System.Text;

namespace SakhtKhaneh.Infrastructure;

public static class IranDateTime
{
    private static readonly PersianCalendar Calendar = new();
    private static readonly TimeZoneInfo IranTimeZone = ResolveIranTimeZone();

    public static DateTime ToIranTime(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

        return TimeZoneInfo.ConvertTimeFromUtc(utc, IranTimeZone);
    }

    public static string ToPersianDate(DateTime value, bool includeTime = false)
    {
        var iran = ToIranTime(value);
        var result = $"{Calendar.GetYear(iran):0000}/{Calendar.GetMonth(iran):00}/{Calendar.GetDayOfMonth(iran):00}";
        if (includeTime)
            result += $" - {iran:HH:mm}";

        return ToPersianDigits(result);
    }

    public static string ToPersianDate(DateTime? value, bool includeTime = false, string fallback = "—")
        => value.HasValue ? ToPersianDate(value.Value, includeTime) : fallback;


    public static DateTime IranNow => ToIranTime(DateTime.UtcNow);

    public static DateTime IranLocalDateToUtc(DateTime iranLocalDate)
    {
        var unspecified = DateTime.SpecifyKind(iranLocalDate.Date, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, IranTimeZone);
    }

    public static string CurrentPersianYear()
        => ToPersianDigits(Calendar.GetYear(ToIranTime(DateTime.UtcNow)).ToString(CultureInfo.InvariantCulture));

    public static string ToPersianDigits(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        const string latin = "0123456789";
        const string persian = "۰۱۲۳۴۵۶۷۸۹";
        var builder = new StringBuilder(value.Length);
        foreach (var character in value)
        {
            var index = latin.IndexOf(character);
            builder.Append(index >= 0 ? persian[index] : character);
        }
        return builder.ToString();
    }

    private static TimeZoneInfo ResolveIranTimeZone()
    {
        foreach (var id in new[] { "Iran Standard Time", "Asia/Tehran" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.CreateCustomTimeZone("IranFallback", TimeSpan.FromHours(3.5), "Iran", "Iran");
    }
}
