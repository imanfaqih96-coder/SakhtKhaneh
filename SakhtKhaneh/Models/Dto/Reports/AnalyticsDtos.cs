namespace SakhtKhaneh.Models.Dto.Reports;

public sealed class AnalyticsPointDto
{
    public DateTime Date { get; set; }
    public int Value { get; set; }
}

public sealed class DashboardStatsDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalVisits { get; set; }
    public int TotalUsers { get; set; }
    public int CitiesCount { get; set; }
    public int CountriesCount { get; set; }
    public decimal ChangePercent { get; set; }
    public IReadOnlyList<AnalyticsPointDto> Trend { get; set; } = Array.Empty<AnalyticsPointDto>();
}

public sealed class AnalyticsReportDto
{
    public string Metric { get; set; } = "visits";
    public string Title { get; set; } = string.Empty;
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int Total { get; set; }
    public decimal ChangePercent { get; set; }
    public IReadOnlyList<AnalyticsPointDto> Series { get; set; } = Array.Empty<AnalyticsPointDto>();
    public IReadOnlyList<AnalyticsBreakdownDto> Breakdown { get; set; } = Array.Empty<AnalyticsBreakdownDto>();
}

public sealed class AnalyticsBreakdownDto
{
    public string Label { get; set; } = string.Empty;
    public string? Path { get; set; }
    public int Value { get; set; }
}
