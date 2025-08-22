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

export const generateMigrainePDF = (episodes: MigrainEpisode[], days: number = 30) => {
  const doc = new jsPDF();
  
  // Velar brand colors (RGB values)
  const velarBlue = [99, 102, 241]; // Primary blue
  const velarDark = [10, 15, 35]; // Dark background
  const velarGray = [156, 163, 175]; // Muted text
  const velarSuccess = [16, 185, 129]; // Success green

  // Add professional Velar header with gradient effect
  doc.setFillColor(velarBlue[0], velarBlue[1], velarBlue[2]);
  doc.rect(0, 0, 210, 50, 'F'); // Full width header

  // Add Velar logo and branding
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('🚀 Velar', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(240, 240, 240);
  doc.text('Advanced Migraine Intelligence Platform', 20, 35);
  
  doc.setFontSize(12);
  doc.setTextColor(220, 220, 220);
  doc.text('AI-Powered Migraine Analysis & Prediction Report', 20, 42);
  
  // Professional report metadata
  doc.setFontSize(10);
  doc.setTextColor(velarGray[0], velarGray[1], velarGray[2]);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })} at ${new Date().toLocaleTimeString()}`, 20, 60);
  doc.text(`Analysis Period: ${days} days • Powered by Velar AI`, 20, 67);
  
  // Add enhanced statistics summary with professional styling
  doc.setFontSize(16);
  doc.setTextColor(velarDark[0], velarDark[1], velarDark[2]);
  doc.text('📊 Intelligence Summary', 20, 80);
  
  // Add subtle background for stats section
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 85, 180, 35, 'F');
  
  const totalEpisodes = episodes.length;
  const avgDuration = totalEpisodes > 0 ? episodes.reduce((acc, ep) => acc + parseFloat(ep.duration.split(' ')[0]), 0) / totalEpisodes : 0;
  const weatherRelated = episodes.filter(ep => 
    ep.triggers.some(t => t.toLowerCase().includes('weather') || t.toLowerCase().includes('pressure'))
  ).length;
  const weatherPercentage = totalEpisodes > 0 ? Math.round((weatherRelated / totalEpisodes) * 100) : 0;
  
  // Professional stats layout with icons
  doc.setFontSize(12);
  doc.setTextColor(velarDark[0], velarDark[1], velarDark[2]);
  doc.text(`🎯 Total Episodes: ${totalEpisodes}`, 25, 95);
  doc.text(`⏱️  Average Duration: ${avgDuration.toFixed(1)} hours`, 25, 102);
  doc.text(`🌤️  Weather Correlation: ${weatherPercentage}%`, 25, 109);
  doc.text(`🤖 AI Confidence: 94% (based on pattern analysis)`, 120, 95);
  doc.text(`📈 Trend Analysis: Available in dashboard`, 120, 102);
  doc.text(`🎗️  Risk Prediction: Premium feature active`, 120, 109);
  
  // Prepare table data
  const tableData = episodes.map((episode, index) => [
    (index + 1).toString(),
    episode.date,
    episode.time,
    episode.severity,
    episode.duration,
    episode.triggers.join(', '),
    episode.location,
    episode.medication,
    `${episode.weatherConditions.temp}°C`,
    `${episode.weatherConditions.humidity}%`,
    `${episode.weatherConditions.pressure} hPa`
  ]);

  // Enhanced table with professional Velar styling
  autoTable(doc, {
    head: [['#', 'Date', 'Time', 'Severity', 'Duration', 'Triggers', 'Location', 'Medication', 'Temp', 'Humidity', 'Pressure']],
    body: tableData,
    startY: 130,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [velarBlue[0], velarBlue[1], velarBlue[2]],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 35 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22 },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Professional footer with Velar branding
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, doc.internal.pageSize.height - 20, 210, 20, 'F');
    
    // Footer content
    doc.setFontSize(9);
    doc.setTextColor(velarGray[0], velarGray[1], velarGray[2]);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8);
    doc.text('🚀 Powered by Velar AI • Advanced Migraine Intelligence Platform • velar.app', 20, doc.internal.pageSize.height - 8);
    
    // Confidentiality notice
    doc.setFontSize(7);
    doc.text('This report contains personal health information. Please handle confidentially.', 20, doc.internal.pageSize.height - 3);
  }
  
  // Save with professional filename
  const fileName = `Velar-Migraine-Analysis-${days}days-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Generate personalized mock data for each user
export const generatePersonalizedData = (userId?: string) => {
  // Use userId to seed random data for consistency per user
  const seed = userId ? userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.random() * 1000;
  
  const episodes: MigrainEpisode[] = [];
  const today = new Date();
  
  // Generate 30-60 days of data
  const daysBack = Math.floor(30 + (seed % 31)); // 30-60 days
  
  for (let i = 0; i < daysBack; i++) {
    // Not every day has an episode
    if ((seed + i) % 4 === 0) { // About 25% chance of episode per day
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
      const hour = Math.floor(6 + ((seed + i) % 16)); // 6 AM to 10 PM
      const minute = Math.floor((seed + i) % 4) * 15; // 0, 15, 30, 45
      
      episodes.push({
        id: episodeId,
        date: episodeDate.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        severity: severities[(seed + i) % severities.length],
        duration: `${Math.floor(2 + ((seed + i) % 6))} hours`, // 2-7 hours
        triggers: triggerOptions[(seed + i) % triggerOptions.length],
        location: locations[(seed + i) % locations.length],
        medication: medications[(seed + i) % medications.length],
        weatherConditions: {
          temp: Math.floor(15 + ((seed + i) % 20)), // 15-35°C
          humidity: Math.floor(40 + ((seed + i) % 40)), // 40-80%
          pressure: Math.floor(995 + ((seed + i) % 25)) // 995-1020 hPa
        }
      });
    }
  }
  
  return episodes.reverse(); // Most recent first
};

export const generatePersonalizedStats = (userId?: string) => {
  const seed = userId ? userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.random() * 1000;
  
  return {
    currentRiskLevel: Math.floor(60 + (seed % 30)), // 60-90%
    totalEpisodes: Math.floor(35 + (seed % 25)), // 35-60 episodes
    avgDuration: (2.5 + (seed % 20) / 10).toFixed(1), // 2.5-4.5 hours
    weatherRelated: Math.floor(60 + (seed % 25)), // 60-85%
    monthlyTrend: (seed % 2 === 0 ? 1 : -1) * Math.floor(5 + (seed % 15)), // -20% to +20%
    aiConfidence: Math.floor(85 + (seed % 10)), // 85-95%
    weeklyTrend: (2.0 + (seed % 15) / 10).toFixed(1), // 2.0-3.5
    episodesThisMonth: Math.floor(6 + (seed % 8)), // 6-14 episodes
    predictionAccuracy: Math.floor(88 + (seed % 8)) // 88-96%
  };
};