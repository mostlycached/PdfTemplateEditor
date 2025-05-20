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
          imagePath: "/templates/corporate-blue.jpg",
          category: "Business"
        },
        {
          name: "Modern Gradient",
          imagePath: "/templates/modern-gradient.jpg",
          category: "Creative"
        },
        {
          name: "Minimal White",
          imagePath: "/templates/minimal-white.jpg",
          category: "Minimalist"
        },
        {
          name: "Bold Red",
          imagePath: "/templates/bold-red.jpg",
          category: "Business"
        },
        {
          name: "Elegant Black",
          imagePath: "/templates/elegant-black.jpg",
          category: "Formal"
        },
        {
          name: "Tech Blue",
          imagePath: "/templates/tech-blue.jpg",
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