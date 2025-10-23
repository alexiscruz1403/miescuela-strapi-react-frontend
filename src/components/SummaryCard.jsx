import{
    Card,
    CardContent,
    Typography
} from "@mui/material";

export const SummaryCard = ({ title, mainContent, secondaryContent = null, type }) => {
    const bgColors = {
        success: "#E6F4EA",
        error: "#FDECEA",
        info: "#E8F0FE"
    };

    const textColors = {
        success: "#1E8E3E",
        error: "#D93025",
        info: "#1967D2"
    };

    return (
        <Card sx={{
            minWidth: 150,
            flex: 1,
            borderTop: `4px solid ${textColors[type] || "#000"}`,
            backgroundColor: bgColors[type] || "#000",
            color: textColors[type] || "#000",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}>
            <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body1">
                    {mainContent}
                </Typography>
                {secondaryContent &&
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {secondaryContent}
                    </Typography>
                }
            </CardContent>
        </Card>
    );
}

