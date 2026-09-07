export type Course = {
  name: string;
  duration: string;
  fees?: string;
  description: string;
  batchNote?: string;
};

export const courses: Course[] = [
  { name: "CCC / MS-CIT / MS Office", duration: "2 to 3 Months", fees: "₹3,500", description: "Build essential computer, internet, and office productivity skills." },
  { name: "Tally + Advanced Tally + GST", duration: "4 to 5 Months", fees: "₹5,500", description: "Learn practical accounting workflows, advanced Tally, and GST fundamentals." },
  { name: "Advanced Excel", duration: "2 Months", fees: "₹3,000", description: "Strengthen spreadsheet skills for efficient analysis, reporting, and office work." },
  { name: "Graphic Designing", duration: "4 to 5 Months", fees: "₹6,000", description: "Develop practical visual design skills for creative and professional projects." },
  { name: "English Speaking", duration: "6 Months", fees: "₹4,000", description: "Improve spoken English and everyday communication with guided practice.", batchNote: "Batch timings available" },
  { name: "CCC + Tally", duration: "6 Months", fees: "₹7,000", description: "Combine computer fundamentals with practical business accounting skills." },
  { name: "CCC + Tally + Advanced Excel", duration: "8 to 9 Months", fees: "₹10,000", description: "A broad skill path covering computers, accounting, and advanced spreadsheets." },
  { name: "CCAS", duration: "10 to 12 Months", fees: "₹13,000", description: "An advanced program designed to develop a wider range of computer skills." },
  { name: "CCAS + E.S.", duration: "Contact Institute", fees: "₹16,000", description: "A combined advanced computer and English speaking learning program." },
  { name: "Web Development", duration: "3 to 6 Months", description: "Learn to create modern, responsive and user-friendly websites using HTML, CSS, JavaScript and modern web technologies." },
  { name: "Full Stack Development", duration: "6 to 9 Months", description: "Learn frontend and backend development and build complete, real-world web applications." },
  { name: "Video Editing", duration: "2 to 4 Months", description: "Learn professional video editing techniques for YouTube, Instagram, social media and other digital platforms." },
  { name: "Animation", duration: "6 to 12 Months", description: "Learn animation concepts and creative techniques to create engaging digital animations and visual content." },
  { name: "Data Science", duration: "6 to 9 Months", description: "Learn data handling, analysis, visualization and machine learning concepts to work with real-world data." },
  { name: "Social Media Marketing", duration: "2 to 3 Months", description: "Learn how to create, manage and grow social media campaigns and build effective digital marketing strategies." },
  { name: "AI / Machine Learning", duration: "6 to 9 Months", description: "Learn the fundamentals of Artificial Intelligence and Machine Learning and understand how intelligent applications are built." },
  { name: "Data Analysis with Power BI", duration: "2 to 3 Months", description: "Learn data analysis, dashboards and interactive business visualization using Microsoft Power BI." },
];
