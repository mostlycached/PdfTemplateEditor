import { db } from "./db";
import { templates } from "@shared/schema";

export async function seedTemplates() {
  try {
    const existingTemplates = await db.select().from(templates);
    
    // Only seed if no templates exist
    if (existingTemplates.length === 0) {
      await db.insert(templates).values([
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
      ]);
      
      console.log("Templates seeded successfully");
    } else {
      console.log("Templates already exist, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}