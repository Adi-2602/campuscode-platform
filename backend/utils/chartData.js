/**
 * Chart Data Utility
 * Format analytics data for frontend chart libraries (Chart.js, Recharts, etc.)
 */

/**
 * Format submission trends for line/bar chart
 */
const formatSubmissionTrendsChart = (trends) => {
  const labels = [];
  const data = [];
  const studentData = [];

  trends.forEach((trend) => {
    // Format label based on period
    let label;
    if (trend._id.hour !== undefined) {
      // Hourly
      label = `${trend._id.day}/${trend._id.month} ${trend._id.hour}:00`;
    } else if (trend._id.day !== undefined) {
      // Daily
      label = `${trend._id.day}/${trend._id.month}/${trend._id.year}`;
    } else if (trend._id.week !== undefined) {
      // Weekly
      label = `Week ${trend._id.week} ${trend._id.year}`;
    } else {
      // Monthly
      label = `${trend._id.month}/${trend._id.year}`;
    }

    labels.push(label);
    data.push(trend.count);
    studentData.push(trend.uniqueStudentCount || 0);
  });

  return {
    labels,
    datasets: [
      {
        label: "Submissions",
        data,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)"
      },
      {
        label: "Unique Students",
        data: studentData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)"
      }
    ]
  };
};

/**
 * Format leaderboard for bar chart
 */
const formatLeaderboardChart = (leaderboard) => {
  const labels = leaderboard.map((student) => student.studentName || "Unknown");
  const data = leaderboard.map((student) => parseFloat(student.averagePercentage) || 0);

  return {
    labels,
    datasets: [
      {
        label: "Average Score (%)",
        data,
        backgroundColor: [
          "rgba(255, 206, 86, 0.8)",  // Gold
          "rgba(192, 192, 192, 0.8)", // Silver
          "rgba(205, 127, 50, 0.8)",  // Bronze
          "rgba(54, 162, 235, 0.8)",  // Blue
          "rgba(75, 192, 192, 0.8)",  // Teal
          "rgba(153, 102, 255, 0.8)", // Purple
          "rgba(255, 159, 64, 0.8)",  // Orange
          "rgba(255, 99, 132, 0.8)",  // Pink
          "rgba(201, 203, 207, 0.8)", // Grey
          "rgba(100, 149, 237, 0.8)"  // Cornflower
        ],
        borderWidth: 1
      }
    ]
  };
};

/**
 * Format student performance for radar chart
 */
const formatStudentPerformanceRadar = (student) => {
  return {
    labels: [
      "Average Score",
      "Pass Rate",
      "Exam Completion",
      "Consistency",
      "Participation"
    ],
    datasets: [
      {
        label: student.studentName || "Student",
        data: [
          parseFloat(student.averagePercentage) || 0,
          parseFloat(student.passRate) || 0,
          (student.totalExams / 10) * 100, // Normalize to 100
          calculateConsistency(student),
          100 // Placeholder for participation
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2
      }
    ]
  };
};

/**
 * Format exam statistics for pie chart (pass/fail)
 */
const formatExamPassFailChart = (examStats) => {
  return {
    labels: ["Passed", "Failed", "Not Submitted"],
    datasets: [
      {
        data: [
          examStats.passCount || 0,
          (examStats.submittedStudents || 0) - (examStats.passCount || 0),
          (examStats.totalStudents || 0) - (examStats.submittedStudents || 0)
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.8)",  // Green
          "rgba(255, 99, 132, 0.8)",  // Red
          "rgba(201, 203, 207, 0.8)"  // Grey
        ],
        borderWidth: 1
      }
    ]
  };
};

/**
 * Format class comparison for grouped bar chart
 */
const formatClassComparisonChart = (comparisons) => {
  const labels = comparisons.map((c) => c.class.name || c.class.id);
  
  const avgScores = comparisons.map((c) => parseFloat(c.averageScore) || 0);
  const passRates = comparisons.map((c) => parseFloat(c.passRate) || 0);
  const studentCounts = comparisons.map((c) => c.studentCount || 0);

  return {
    labels,
    datasets: [
      {
        label: "Average Score",
        data: avgScores,
        backgroundColor: "rgba(54, 162, 235, 0.8)"
      },
      {
        label: "Pass Rate (%)",
        data: passRates,
        backgroundColor: "rgba(75, 192, 192, 0.8)"
      },
      {
        label: "Students (×10)",
        data: studentCounts.map(count => count / 10), // Scale down for visibility
        backgroundColor: "rgba(255, 206, 86, 0.8)"
      }
    ]
  };
};

/**
 * Format teacher activity for doughnut chart
 */
const formatTeacherActivityChart = (activity) => {
  return {
    labels: ["Classes", "Exams", "Questions", "Students (÷10)"],
    datasets: [
      {
        data: [
          activity.classesCreated || 0,
          activity.examsCreated || 0,
          activity.questionsCreated || 0,
          Math.floor((activity.totalStudents || 0) / 10) // Scale down
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)"
        ],
        borderWidth: 1
      }
    ]
  };
};

/**
 * Format exam states distribution for doughnut chart
 */
const formatExamStatesChart = (examsByState) => {
  return {
    labels: ["Draft", "Published", "Ongoing", "Ended", "Results Published"],
    datasets: [
      {
        data: [
          examsByState.draft || 0,
          examsByState.published || 0,
          examsByState.ongoing || 0,
          examsByState.ended || 0,
          examsByState.resultPublished || 0
        ],
        backgroundColor: [
          "rgba(201, 203, 207, 0.8)", // Grey
          "rgba(54, 162, 235, 0.8)",  // Blue
          "rgba(255, 206, 86, 0.8)",  // Yellow
          "rgba(255, 99, 132, 0.8)",  // Red
          "rgba(75, 192, 192, 0.8)"   // Green
        ],
        borderWidth: 1
      }
    ]
  };
};

/**
 * Format system stats for multi-metric display
 */
const formatSystemStatsCards = (stats) => {
  return [
    {
      title: "Total Students",
      value: stats.users.students,
      subtitle: `${stats.users.activeStudents} active`,
      icon: "users",
      color: "blue"
    },
    {
      title: "Total Teachers",
      value: stats.users.teachers,
      subtitle: `${stats.users.activeTeachers} active`,
      icon: "user-check",
      color: "green"
    },
    {
      title: "Total Classes",
      value: stats.classes,
      icon: "book",
      color: "purple"
    },
    {
      title: "Total Exams",
      value: stats.exams,
      icon: "file-text",
      color: "orange"
    },
    {
      title: "Total Submissions",
      value: stats.submissions,
      icon: "code",
      color: "red"
    }
  ];
};

/**
 * Format heatmap data for submission activity
 */
const formatSubmissionHeatmap = (trends) => {
  const heatmapData = [];

  trends.forEach((trend) => {
    heatmapData.push({
      day: trend._id.day || 0,
      hour: trend._id.hour || 0,
      value: trend.count
    });
  });

  return heatmapData;
};

/**
 * Format time series for multiple metrics
 */
const formatTimeSeriesChart = (data, metrics) => {
  const labels = data.map((item) => item.date || item.label);
  const datasets = [];

  metrics.forEach((metric, index) => {
    const colors = [
      "rgb(75, 192, 192)",
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 206, 86)",
      "rgb(153, 102, 255)"
    ];

    datasets.push({
      label: metric.label,
      data: data.map((item) => item[metric.key]),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace("rgb", "rgba").replace(")", ", 0.2)"),
      tension: 0.4
    });
  });

  return { labels, datasets };
};

/**
 * Calculate consistency score (helper function)
 */
const calculateConsistency = (student) => {
  if (!student.highestScore || !student.lowestScore || !student.averageScore) {
    return 0;
  }

  const range = student.highestScore - student.lowestScore;
  const maxRange = student.averageScore * 2; // Theoretical max range

  // Lower range = higher consistency
  const consistency = ((maxRange - range) / maxRange) * 100;
  return Math.max(0, Math.min(100, consistency));
};

/**
 * Format data for table view
 */
const formatTableData = (data, columns) => {
  return {
    columns: columns.map((col) => ({
      key: col.key,
      label: col.label,
      sortable: col.sortable !== false
    })),
    rows: data.map((item, index) => ({
      id: item._id || item.id || index,
      ...item
    }))
  };
};

/**
 * Generate color palette
 */
const generateColorPalette = (count) => {
  const baseColors = [
    "rgba(255, 99, 132, 0.8)",
    "rgba(54, 162, 235, 0.8)",
    "rgba(255, 206, 86, 0.8)",
    "rgba(75, 192, 192, 0.8)",
    "rgba(153, 102, 255, 0.8)",
    "rgba(255, 159, 64, 0.8)"
  ];

  const palette = [];
  for (let i = 0; i < count; i++) {
    palette.push(baseColors[i % baseColors.length]);
  }

  return palette;
};

module.exports = {
  formatSubmissionTrendsChart,
  formatLeaderboardChart,
  formatStudentPerformanceRadar,
  formatExamPassFailChart,
  formatClassComparisonChart,
  formatTeacherActivityChart,
  formatExamStatesChart,
  formatSystemStatsCards,
  formatSubmissionHeatmap,
  formatTimeSeriesChart,
  formatTableData,
  generateColorPalette
};