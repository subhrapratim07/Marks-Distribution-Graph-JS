const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ChartDataLabels = require('chartjs-plugin-datalabels');
const fs = require('fs');
const XLSX = require('xlsx');

// Constants
const WIDTH = 1400;
const HEIGHT = 600;
const MAX_TOTAL_MARKS = 400;
const SUBJECT_NAMES = ['ADMS', 'AOS', 'A&CD', 'C&NS'];

// Read Excel file
const workbook = XLSX.readFile('./student_marks.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet);

// Extract data
const marksData = jsonData.map(student =>
  SUBJECT_NAMES.map(subject => student[subject])
);

// --- Total scorer analysis
let above360 = 0, below160 = 0;
let highScorers = [], lowScorers = [];

const totalMarksArray = marksData.map((marks, i) => {
  const total = marks.reduce((a, b) => a + b, 0);
  if (total > 360) {
    above360++;
    highScorers.push(jsonData[i].Name);
  }
  if (total < 160) {
    below160++;
    lowScorers.push(jsonData[i].Name);
  }
  return total;
});

// --- Labels for Graph 1
const labels = jsonData.map((student, i) => {
  const total = totalMarksArray[i];
  if (total > 360) return `⭐ ${student.Name}`;
  if (total < 160) return `⚠️ ${student.Name}`;
  return student.Name;
});

// --- Dataset for Graph 1
const subjectDatasets = SUBJECT_NAMES.map((subject, subjIndex) => ({
  label: subject,
  data: marksData.map(student => student[subjIndex]),
  backgroundColor: `hsl(${subjIndex * 90}, 70%, 60%)`,
  borderColor: `hsl(${subjIndex * 90}, 70%, 40%)`,
  borderWidth: 1
}));

const canvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT, plugins: { modern: ['chartjs-plugin-datalabels'] } });

async function generateCharts() {
  // --------- GRAPH 1: Total Marks Distribution (Stacked Bar)
  const stackedChartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: subjectDatasets
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Total Marks Distribution (Stacked by Subject)',
          font: { size: 18 }
        },
        legend: { position: 'top' },
        datalabels: {
          color: '#000',
          anchor: 'center',
          align: 'center',
          font: { weight: 'bold', size: 12 },
          formatter: v => v
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { maxRotation: 90, minRotation: 90, autoSkip: false }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: MAX_TOTAL_MARKS,
          title: { display: true, text: 'Total Marks (out of 400)' }
        }
      }
    },
    plugins: [
      {
        id: 'whiteBackground',
        beforeDraw: (chart) => {
          const { ctx, width, height } = chart;
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      },
      ChartDataLabels,
      {
        id: 'legendTextNote',
        afterDraw: (chart) => {
          const { ctx } = chart;
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#000';
          ctx.textAlign = 'left';
          ctx.fillText('⭐ High Scorer (>360 total marks)', 50, 60);
          ctx.fillText('⚠️ Low Scorer (<160 total marks)', 50, 80);
          ctx.restore();
        }
      }
    ]
  };

  const buffer1 = await canvas.renderToBuffer(stackedChartConfig);
  fs.writeFileSync('./chart-stacked-total.png', buffer1);
  console.log('✅ Stacked chart saved as chart-stacked-total.png');

  // --------- GRAPH 2: Subject-wise above 90 / below 40
  const above90Counts = SUBJECT_NAMES.map((subject, i) =>
    marksData.filter(marks => marks[i] > 90).length
  );
  const below40Counts = SUBJECT_NAMES.map((subject, i) =>
    marksData.filter(marks => marks[i] < 40).length
  );

  const subjectStatConfig = {
    type: 'bar',
    data: {
      labels: SUBJECT_NAMES,
      datasets: [
        {
          label: 'Above 90',
          data: above90Counts,
          backgroundColor: 'rgba(0, 200, 200, 0.6)'
        },
        {
          label: 'Below 40',
          data: below40Counts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Subject-wise Student Count (Above 90 / Below 40)',
          font: { size: 18 }
        },
        legend: { position: 'top' },
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold', size: 14 },
          formatter: v => v
        }
      },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Students' }
        }
      }
    },
    plugins: [
      ChartDataLabels,
      {
        id: 'whiteBackground',
        beforeDraw: (chart) => {
          const { ctx, width, height } = chart;
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }
    ]
  };

  const buffer2 = await canvas.renderToBuffer(subjectStatConfig);
  fs.writeFileSync('./chart-subject-thresholds.png', buffer2);
  console.log('✅ Subject-wise threshold chart saved as chart-subject-thresholds.png');

  // --------- Console Summary
  console.log(`\n⭐ Students scoring above 360: ${above360}`);
  console.log(` ➤ ${highScorers.join(', ') || 'None'}`);
  console.log(`⚠️ Students scoring below 160: ${below160}`);
  console.log(` ➤ ${lowScorers.join(', ') || 'None'}`);
}

generateCharts();
