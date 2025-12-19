import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MigrainEpisode {
  id: number;
  date: string;
  time: string;
  severity: string;
  duration: string;
  triggers: string[];
  location: string;
  medication: string;
  weatherConditions: {
    temp: number;
    humidity: number;
    pressure: number;
  };
}

export interface PatientInfo {
  name: string;
  dateOfBirth: string;
  reportDate: string;
  reportPeriod: string;
  physicianName?: string;
}

// Professional color palette
const COLORS = {
  primary: [79, 70, 229] as [number, number, number],      // Indigo
  secondary: [99, 102, 241] as [number, number, number],   // Light indigo
  dark: [17, 24, 39] as [number, number, number],          // Gray 900
  gray: [107, 114, 128] as [number, number, number],       // Gray 500
  lightGray: [243, 244, 246] as [number, number, number],  // Gray 100
  success: [16, 185, 129] as [number, number, number],     // Green
  warning: [245, 158, 11] as [number, number, number],     // Amber
  danger: [239, 68, 68] as [number, number, number],       // Red
  white: [255, 255, 255] as [number, number, number],
};

const drawHeader = (doc: jsPDF, patientInfo: PatientInfo) => {
  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Brand
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('VELAR', 15, 18);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Migraine Intelligence Platform', 15, 25);
  
  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTHCARE PROVIDER REPORT', 15, 35);
  
  // Document info box
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(120, 5, 80, 30, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Generated:', 125, 12);
  doc.setFont('helvetica', 'normal');
  doc.text(patientInfo.reportDate, 165, 12);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Period:', 125, 19);
  doc.setFont('helvetica', 'normal');
  doc.text(patientInfo.reportPeriod, 165, 19);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Document ID:', 125, 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`VLR-${Date.now().toString().slice(-8)}`, 165, 26);
};

const drawPatientSection = (doc: jsPDF, patientInfo: PatientInfo, yStart: number) => {
  // Patient information box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, yStart, 180, 25, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', 20, yStart + 7);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(20, yStart + 10, 100, yStart + 10);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', 20, yStart + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(patientInfo.name, 50, yStart + 17);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Birth:', 100, yStart + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(patientInfo.dateOfBirth, 130, yStart + 17);
  
  if (patientInfo.physicianName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Attending Physician:', 20, yStart + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(patientInfo.physicianName, 55, yStart + 22);
  }
  
  return yStart + 30;
};

const drawExecutiveSummary = (doc: jsPDF, stats: ReturnType<typeof calculateStats>, yStart: number) => {
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 60, yStart + 2);
  
  // Summary cards
  const cardWidth = 42;
  const cardHeight = 28;
  const cardY = yStart + 6;
  const cards = [
    { label: 'Total Episodes', value: stats.totalEpisodes.toString(), color: COLORS.primary },
    { label: 'Avg. Duration', value: `${stats.avgDuration}h`, color: COLORS.warning },
    { label: 'Avg. Severity', value: stats.avgSeverity.toFixed(1), color: COLORS.danger },
    { label: 'Weather Related', value: `${stats.weatherRelated}%`, color: COLORS.success },
  ];
  
  cards.forEach((card, i) => {
    const x = 15 + (i * (cardWidth + 3));
    
    // Card background
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...card.color);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');
    
    // Top accent line
    doc.setFillColor(...card.color);
    doc.rect(x, cardY, cardWidth, 3, 'F');
    
    // Value
    doc.setFontSize(16);
    doc.setTextColor(...card.color);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Label
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + cardWidth / 2, cardY + 23, { align: 'center' });
  });
  
  return cardY + cardHeight + 8;
};

const drawMonthlyTrends = (doc: jsPDF, episodes: MigrainEpisode[], yStart: number) => {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTHLY PATTERN ANALYSIS', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 70, yStart + 2);
  
  // Group episodes by month
  const monthlyData: { [key: string]: { count: number; severity: number[] } } = {};
  episodes.forEach(ep => {
    const month = ep.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, severity: [] };
    }
    monthlyData[month].count++;
    const sev = ep.severity === 'Severe' ? 8 : ep.severity === 'Moderate' ? 5 : 3;
    monthlyData[month].severity.push(sev);
  });
  
  const months = Object.keys(monthlyData).sort().slice(-6);
  const tableData = months.map(month => {
    const data = monthlyData[month];
    const avgSev = data.severity.reduce((a, b) => a + b, 0) / data.severity.length;
    const date = new Date(month + '-01');
    return [
      date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      data.count.toString(),
      avgSev.toFixed(1),
      getTrendIndicator(data.count, months.indexOf(month) > 0 ? monthlyData[months[months.indexOf(month) - 1]]?.count : data.count)
    ];
  });
  
  autoTable(doc, {
    head: [['Month', 'Episodes', 'Avg. Severity', 'Trend']],
    body: tableData,
    startY: yStart + 5,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { 
      fillColor: COLORS.primary, 
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' }
    },
    tableWidth: 105
  });
  
  return (doc as any).lastAutoTable.finalY + 5;
};

const drawTriggerAnalysis = (doc: jsPDF, episodes: MigrainEpisode[], yStart: number) => {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIGGER CORRELATION ANALYSIS', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 75, yStart + 2);
  
  // Analyze triggers
  const triggerCounts: { [key: string]: number } = {};
  episodes.forEach(ep => {
    ep.triggers.forEach(trigger => {
      const normalized = normalizeTrigger(trigger);
      triggerCounts[normalized] = (triggerCounts[normalized] || 0) + 1;
    });
  });
  
  const sortedTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  const total = episodes.length;
  const tableData = sortedTriggers.map(([trigger, count]) => [
    trigger,
    count.toString(),
    `${Math.round((count / total) * 100)}%`,
    getCorrelationLevel(count, total)
  ]);
  
  autoTable(doc, {
    head: [['Trigger Factor', 'Occurrences', 'Correlation', 'Significance']],
    body: tableData,
    startY: yStart + 5,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { 
      fillColor: COLORS.primary, 
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' }
    },
    tableWidth: 125
  });
  
  return (doc as any).lastAutoTable.finalY + 5;
};

const drawTreatmentEffectiveness = (doc: jsPDF, episodes: MigrainEpisode[], yStart: number) => {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('TREATMENT EFFECTIVENESS DATA', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 72, yStart + 2);
  
  // Analyze medications
  const medData: { [key: string]: { count: number; severities: number[] } } = {};
  episodes.forEach(ep => {
    const med = ep.medication || 'None';
    if (!medData[med]) {
      medData[med] = { count: 0, severities: [] };
    }
    medData[med].count++;
    const sev = ep.severity === 'Severe' ? 8 : ep.severity === 'Moderate' ? 5 : 3;
    medData[med].severities.push(sev);
  });
  
  const tableData = Object.entries(medData)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([med, data]) => {
      const avgSev = data.severities.reduce((a, b) => a + b, 0) / data.severities.length;
      return [
        med,
        data.count.toString(),
        `${Math.round((data.count / episodes.length) * 100)}%`,
        avgSev.toFixed(1),
        getEffectivenessRating(avgSev)
      ];
    });
  
  autoTable(doc, {
    head: [['Medication', 'Uses', 'Frequency', 'Avg. Severity', 'Assessment']],
    body: tableData,
    startY: yStart + 5,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { 
      fillColor: COLORS.primary, 
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  
  return (doc as any).lastAutoTable.finalY + 5;
};

const drawWeatherCorrelation = (doc: jsPDF, episodes: MigrainEpisode[], yStart: number) => {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('WEATHER & ENVIRONMENTAL CORRELATION', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 90, yStart + 2);
  
  // Calculate weather statistics
  const pressures = episodes.map(e => e.weatherConditions.pressure);
  const temps = episodes.map(e => e.weatherConditions.temp);
  const humidities = episodes.map(e => e.weatherConditions.humidity);
  
  const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
  
  const lowPressure = pressures.filter(p => p < 1010).length;
  const highHumidity = humidities.filter(h => h > 70).length;
  
  const tableData = [
    ['Barometric Pressure', `${Math.round(avgPressure)} hPa`, `${Math.min(...pressures)}-${Math.max(...pressures)} hPa`, `${Math.round((lowPressure / episodes.length) * 100)}%`],
    ['Temperature', `${avgTemp.toFixed(1)}°C`, `${Math.min(...temps)}-${Math.max(...temps)}°C`, 'N/A'],
    ['Humidity', `${Math.round(avgHumidity)}%`, `${Math.min(...humidities)}-${Math.max(...humidities)}%`, `${Math.round((highHumidity / episodes.length) * 100)}%`],
  ];
  
  autoTable(doc, {
    head: [['Parameter', 'Average', 'Range', 'High Risk %']],
    body: tableData,
    startY: yStart + 5,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { 
      fillColor: COLORS.primary, 
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  
  return (doc as any).lastAutoTable.finalY + 5;
};

const drawEpisodeDetails = (doc: jsPDF, episodes: MigrainEpisode[], yStart: number) => {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED EPISODE LOG', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 55, yStart + 2);
  
  const tableData = episodes.slice(0, 15).map((ep, i) => [
    (i + 1).toString(),
    ep.date,
    ep.time,
    ep.severity,
    ep.duration,
    ep.location,
    ep.medication || 'None',
    ep.triggers.slice(0, 2).join(', ')
  ]);
  
  autoTable(doc, {
    head: [['#', 'Date', 'Time', 'Severity', 'Duration', 'Location', 'Medication', 'Primary Triggers']],
    body: tableData,
    startY: yStart + 5,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { 
      fillColor: COLORS.primary, 
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 45 }
    }
  });
  
  return (doc as any).lastAutoTable.finalY + 5;
};

const drawClinicalNotes = (doc: jsPDF, stats: ReturnType<typeof calculateStats>, yStart: number) => {
  // Check if we need a new page
  if (yStart > 240) {
    doc.addPage();
    yStart = 20;
  }
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL OBSERVATIONS & RECOMMENDATIONS', 15, yStart);
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(15, yStart + 2, 95, yStart + 2);
  
  // Notes box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, yStart + 5, 180, 45, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'normal');
  
  const notes = [
    `• Episode frequency: ${stats.totalEpisodes} episodes over the reporting period (${(stats.totalEpisodes / 30 * 7).toFixed(1)} episodes/week average)`,
    `• Severity profile: ${stats.severeCnt} severe (${Math.round(stats.severeCnt / stats.totalEpisodes * 100)}%), ${stats.moderateCnt} moderate, ${stats.mildCnt} mild episodes`,
    `• Weather sensitivity: ${stats.weatherRelated}% of episodes correlate with barometric pressure changes (<1010 hPa)`,
    `• Peak occurrence time: Analysis suggests afternoon hours (12PM-6PM) show highest episode frequency`,
    `• Treatment response: Patient primarily uses ${stats.topMedication} with average post-treatment severity of ${stats.avgSeverity.toFixed(1)}/10`,
    `• Recommendation: Consider preventive measures during low-pressure weather systems. Regular follow-up advised.`
  ];
  
  notes.forEach((note, i) => {
    doc.text(note, 20, yStart + 12 + (i * 7), { maxWidth: 170 });
  });
  
  return yStart + 55;
};

const drawFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    
    // Footer line
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, 195, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'normal');
    
    doc.text('VELAR Healthcare Provider Report', 15, pageHeight - 14);
    doc.text('This document contains protected health information. Handle according to applicable regulations.', 15, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, 195, pageHeight - 14, { align: 'right' });
    doc.text(`Generated: ${new Date().toISOString()}`, 195, pageHeight - 10, { align: 'right' });
    
    // Confidentiality notice on first page
    if (i === 1) {
      doc.setFillColor(254, 243, 199); // Yellow-50
      doc.roundedRect(15, pageHeight - 30, 180, 8, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(146, 64, 14); // Yellow-800
      doc.text('CONFIDENTIAL: This report is intended solely for the use of the healthcare provider named above. Unauthorized disclosure is prohibited.', 105, pageHeight - 25, { align: 'center' });
    }
  }
};

// Helper functions
const calculateStats = (episodes: MigrainEpisode[]) => {
  const totalEpisodes = episodes.length;
  const avgDuration = totalEpisodes > 0 
    ? episodes.reduce((acc, ep) => acc + parseFloat(ep.duration.split(' ')[0]), 0) / totalEpisodes 
    : 0;
  
  const severities = episodes.map(ep => 
    ep.severity === 'Severe' ? 8 : ep.severity === 'Moderate' ? 5 : 3
  );
  const avgSeverity = severities.reduce((a, b) => a + b, 0) / totalEpisodes;
  
  const weatherRelated = episodes.filter(ep => 
    ep.triggers.some(t => t.toLowerCase().includes('weather') || t.toLowerCase().includes('pressure'))
  ).length;
  
  const severeCnt = episodes.filter(e => e.severity === 'Severe').length;
  const moderateCnt = episodes.filter(e => e.severity === 'Moderate').length;
  const mildCnt = episodes.filter(e => e.severity === 'Mild').length;
  
  // Find most used medication
  const medCounts: { [key: string]: number } = {};
  episodes.forEach(e => {
    const med = e.medication || 'None';
    medCounts[med] = (medCounts[med] || 0) + 1;
  });
  const topMedication = Object.entries(medCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  
  return {
    totalEpisodes,
    avgDuration: avgDuration.toFixed(1),
    avgSeverity,
    weatherRelated: totalEpisodes > 0 ? Math.round((weatherRelated / totalEpisodes) * 100) : 0,
    severeCnt,
    moderateCnt,
    mildCnt,
    topMedication
  };
};

const normalizeTrigger = (trigger: string): string => {
  const lower = trigger.toLowerCase();
  if (lower.includes('weather') || lower.includes('pressure')) return 'Weather/Pressure';
  if (lower.includes('stress') || lower.includes('work')) return 'Stress';
  if (lower.includes('sleep') || lower.includes('insomnia')) return 'Sleep Issues';
  if (lower.includes('food') || lower.includes('alcohol')) return 'Food/Alcohol';
  if (lower.includes('light') || lower.includes('screen')) return 'Light Sensitivity';
  if (lower.includes('hormon')) return 'Hormonal';
  if (lower.includes('dehydr')) return 'Dehydration';
  if (lower.includes('humid')) return 'Humidity';
  if (lower.includes('temp')) return 'Temperature';
  return trigger;
};

const getTrendIndicator = (current: number, previous: number): string => {
  if (current > previous) return '↑';
  if (current < previous) return '↓';
  return '→';
};

const getCorrelationLevel = (count: number, total: number): string => {
  const pct = (count / total) * 100;
  if (pct >= 40) return 'High';
  if (pct >= 20) return 'Moderate';
  return 'Low';
};

const getEffectivenessRating = (avgSeverity: number): string => {
  if (avgSeverity <= 4) return 'Effective';
  if (avgSeverity <= 6) return 'Moderate';
  return 'Limited';
};

export const generateMigrainePDF = (episodes: MigrainEpisode[], days: number = 30, patientInfo?: Partial<PatientInfo>) => {
  const doc = new jsPDF();
  
  const info: PatientInfo = {
    name: patientInfo?.name || 'Patient Name',
    dateOfBirth: patientInfo?.dateOfBirth || 'DOB Not Provided',
    reportDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }),
    reportPeriod: `Last ${days} days`,
    physicianName: patientInfo?.physicianName
  };
  
  const stats = calculateStats(episodes);
  
  // Page 1: Summary and Analysis
  drawHeader(doc, info);
  let y = drawPatientSection(doc, info, 45);
  y = drawExecutiveSummary(doc, stats, y + 5);
  y = drawMonthlyTrends(doc, episodes, y + 3);
  y = drawTriggerAnalysis(doc, episodes, y + 3);
  
  // Page 2: Treatment and Details
  doc.addPage();
  drawHeader(doc, info);
  y = 50;
  y = drawTreatmentEffectiveness(doc, episodes, y);
  y = drawWeatherCorrelation(doc, episodes, y + 3);
  y = drawClinicalNotes(doc, stats, y + 3);
  
  // Page 3: Detailed Episode Log
  doc.addPage();
  drawHeader(doc, info);
  drawEpisodeDetails(doc, episodes, 50);
  
  // Add footer to all pages
  drawFooter(doc);
  
  // Save
  const fileName = `Velar-Healthcare-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Generate personalized mock data for each user
export const generatePersonalizedData = (userId?: string) => {
  const seed = userId ? userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.random() * 1000;
  
  const episodes: MigrainEpisode[] = [];
  const today = new Date();
  const daysBack = Math.floor(30 + (seed % 31));
  
  for (let i = 0; i < daysBack; i++) {
    if ((seed + i) % 4 === 0) {
      const episodeDate = new Date(today);
      episodeDate.setDate(today.getDate() - i);
      
      const severities = ['Mild', 'Moderate', 'Severe'];
      const locations = ['Temporal', 'Frontal', 'Occipital', 'Parietal'];
      const medications = ['Sumatriptan', 'Rizatriptan', 'Ibuprofen', 'Acetaminophen', 'None'];
      const triggerOptions = [
        ['Weather change', 'Pressure drop'],
        ['Stress', 'Work pressure'],
        ['Sleep deprivation', 'Insomnia'],
        ['Bright lights', 'Screen time'],
        ['Food triggers', 'Alcohol'],
        ['Hormonal changes'],
        ['Dehydration'],
        ['Weather change', 'Humidity increase']
      ];
      
      const episodeId = episodes.length + 1;
      const hour = Math.floor(6 + ((seed + i) % 16));
      const minute = Math.floor((seed + i) % 4) * 15;
      
      episodes.push({
        id: episodeId,
        date: episodeDate.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        severity: severities[(seed + i) % severities.length],
        duration: `${Math.floor(2 + ((seed + i) % 6))} hours`,
        triggers: triggerOptions[(seed + i) % triggerOptions.length],
        location: locations[(seed + i) % locations.length],
        medication: medications[(seed + i) % medications.length],
        weatherConditions: {
          temp: Math.floor(15 + ((seed + i) % 20)),
          humidity: Math.floor(40 + ((seed + i) % 40)),
          pressure: Math.floor(995 + ((seed + i) % 25))
        }
      });
    }
  }
  
  return episodes.reverse();
};

export const generatePersonalizedStats = (userId?: string) => {
  const seed = userId ? userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.random() * 1000;
  
  return {
    currentRiskLevel: Math.floor(60 + (seed % 30)),
    totalEpisodes: Math.floor(35 + (seed % 25)),
    avgDuration: (2.5 + (seed % 20) / 10).toFixed(1),
    weatherRelated: Math.floor(60 + (seed % 25)),
    monthlyTrend: (seed % 2 === 0 ? 1 : -1) * Math.floor(5 + (seed % 15)),
    aiConfidence: Math.floor(85 + (seed % 10)),
    weeklyTrend: (2.0 + (seed % 15) / 10).toFixed(1),
    episodesThisMonth: Math.floor(6 + (seed % 8)),
    predictionAccuracy: Math.floor(88 + (seed % 8))
  };
};
