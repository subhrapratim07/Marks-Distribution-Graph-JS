const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

// Constants
const NUM_STUDENTS = 40;
const SUBJECTS = 4;
const SUBJECT_NAMES = ['Math', 'Physics', 'Chemistry', 'CS'];
const WIDTH = 1400;
const HEIGHT = 600;

// Generate random marks for 40 students across 4 subjects
let marksData = [];
for (let i = 0; i < NUM_STUDENTS; i++) {
    let studentMarks = [];
    for (let j = 0; j < SUBJECTS; j++) {
        studentMarks.push(Math.floor(Math.random() * 101)); // 0 to 100
    }
    marksData.push(studentMarks);
}

// Count students with average marks above 90 or below 40
let above90 = 0, below40 = 0;
marksData.forEach(student => {
    const avg = student.reduce((a, b) => a + b) / SUBJECTS;
    if (avg > 90) above90++;
    if (avg < 40) below40++;
});

console.log(`Students scoring average above 90: ${above90}`);
console.log(`Students scoring average below 40: ${below40}`);

// Prepare chart datasets: one dataset per subject
const subjectDatasets = SUBJECT_NAMES.map((subject, subjIndex) => ({
    label: subject,
    data: marksData.map(student => student[subjIndex]),
    backgroundColor: `hsl(${subjIndex * 90}, 70%, 60%)`,
    borderColor: `hsl(${subjIndex * 90}, 70%, 40%)`,
    borderWidth: 1
}));

// Setup ChartJS with NodeCanvas
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT });

async function generateChart() {
    const config = {
        type: 'bar',
        data: {
            labels: Array.from({ length: NUM_STUDENTS }, (_, i) => `Student ${i + 1}`),
            datasets: subjectDatasets
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Grouped Subject-wise Marks Distribution (40 Students)'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: false,
                    ticks: {
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Marks'
                    }
                }
            }
        }
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config);
    fs.writeFileSync('./grouped-subject-distribution.png', buffer);
    console.log('Chart saved as grouped-subject-distribution.png');
}

generateChart();
