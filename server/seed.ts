import { getContainer, CONTAINERS } from "./cosmos";
import { cosmosStorage } from "./cosmosStorage";

export async function seedTemplates() {
  try {
    const templates = await cosmosStorage.getAllTemplates();
    
    // Only seed if no templates exist
    if (templates.length === 0) {
      const templateData = [
        {
          name: "Corporate Blue",
          imagePath: "/templates/corporate-blue.svg",
          category: "Business"
        },
        {
          name: "Modern Gradient",
          imagePath: "/templates/modern-gradient.svg",
          category: "Creative"
        },
        {
          name: "Minimal White",
          imagePath: "/templates/minimal-white.svg",
          category: "Minimalist"
        },
        {
          name: "Bold Red",
          imagePath: "/templates/bold-red.svg",
          category: "Business"
        },
        {
          name: "Elegant Black",
          imagePath: "/templates/elegant-black.svg",
          category: "Formal"
        },
        {
          name: "Tech Blue",
          imagePath: "/templates/tech-blue.svg",
          category: "Technology"
        }
      ];
      
      // Insert templates one by one
      for (const template of templateData) {
        await cosmosStorage.createTemplate(template);
      }
      
      console.log("Templates seeded successfully");
    } else {
      console.log("Templates already exist, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}