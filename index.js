const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const XLSX = require('xlsx');

// Constants
const WIDTH = 1400;
const HEIGHT = 600;
const MAX_TOTAL_MARKS = 400;
const SUBJECT_NAMES = ['Math', 'Physics', 'Chemistry', 'CS'];

// Read Excel file
const workbook = XLSX.readFile('./student_marks.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet);

// Extract marks data
const marksData = jsonData.map(student => SUBJECT_NAMES.map(subject => student[subject]));

// Count students with total marks above 360 and below 160
let above360 = 0, below160 = 0;
marksData.forEach(student => {
    const total = student.reduce((a, b) => a + b, 0);
    if (total > 360) above360++;
    if (total < 160) below160++;
});

console.log(`Students scoring total above 360 (90% of 400): ${above360}`);
console.log(`Students scoring total below 160 (40% of 400): ${below160}`);

// Create datasets for stacked chart
const subjectDatasets = SUBJECT_NAMES.map((subject, subjIndex) => ({
    label: subject,
    data: marksData.map(student => student[subjIndex]),
    backgroundColor: `hsl(${subjIndex * 90}, 70%, 60%)`,
    borderColor: `hsl(${subjIndex * 90}, 70%, 40%)`,
    borderWidth: 1
}));

// Setup ChartJSNodeCanvas
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT });

async function generateChart() {
    const config = {
    type: 'bar',
    data: {
        labels: jsonData.map(student => student.Name),
        datasets: subjectDatasets
    },
    options: {
        responsive: false,
        plugins: {
            title: {
                display: true,
                text: 'Total Marks Distribution (Stacked by Subject)'
            },
            legend: {
                position: 'top'
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    maxRotation: 90,
                    minRotation: 90,
                    autoSkip: false
                }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                max: MAX_TOTAL_MARKS,
                title: {
                    display: true,
                    text: 'Total Marks (out of 400)'
                }
            }
        }
    },
    plugins: [
        {
            id: 'whiteBackground',
            beforeDraw: (chart) => {
                const { ctx, width, height } = chart;
                ctx.save();
                ctx.fillStyle = 'white'; // Set solid white background
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }
    ]
};


    const buffer = await chartJSNodeCanvas.renderToBuffer(config);
    fs.writeFileSync('./stacked-total-marks-distribution.png', buffer);
    console.log('Chart saved as stacked-total-marks-distribution.png');
}

generateChart();
