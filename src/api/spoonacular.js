// src/api/spoonacular.js
// Handles all communication with the Spoonacular Recipe API

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY;
const BASE_URL = 'https://api.spoonacular.com';

/**
 * Search for recipes based on ingredients the user has.
 * Filters to only return recipes under 25 minutes prep time.
 * @param {string[]} ingredients - Array of ingredient strings e.g. ["chicken", "rice"]
 * @returns {Promise<Array>} - Array of recipe objects
 */
export const searchRecipesByIngredients = async (ingredients) => {
  try {
    // Join ingredients into comma-separated string for the API
    const ingredientString = ingredients.join(',');

    // Step 1: Search recipes by ingredients
    const searchResponse = await fetch(
      `${BASE_URL}/recipes/findByIngredients?` +
      `ingredients=${ingredientString}` +
      `&number=10` +        // Get 10 results to filter from
      `&ranking=1` +        // Maximize used ingredients
      `&ignorePantry=true` + // Ignore common pantry items
      `&apiKey=${API_KEY}`
    );

    if (!searchResponse.ok) {
      throw new Error(`API error: ${searchResponse.status}`);
    }

    const recipes = await searchResponse.json();

    if (!recipes || recipes.length === 0) {
      return [];
    }

    // Step 2: Get full details for each recipe to check prep time
    const detailedRecipes = await Promise.all(
      recipes.slice(0, 5).map(async (recipe) => {
        const detailResponse = await fetch(
          `${BASE_URL}/recipes/${recipe.id}/information?` +
          `apiKey=${API_KEY}`
        );
        if (!detailResponse.ok) return null;
        return detailResponse.json();
      })
    );

    // Step 3: Filter to only recipes under 25 minutes
    console.log('Recipes found:', detailedRecipes.map(r => r?.title + ' - ' + r?.readyInMinutes + 'min'));
    const quickRecipes = detailedRecipes
      .filter(recipe => recipe !== null)
      .filter(recipe => recipe.readyInMinutes <= 45);

    // Step 4: Format into our app's data structure
    return quickRecipes.map(recipe => ({
      id: recipe.id,
      name: recipe.title,
      description: recipe.summary
        ? recipe.summary.replace(/<[^>]*>/g, '').slice(0, 100) + '...'
        : 'A quick and delicious recipe.',
      prepTime: recipe.readyInMinutes,
      ingredients: recipe.extendedIngredients
        ? recipe.extendedIngredients.slice(0, 4).map(i => i.name)
        : ingredients,
      image: recipe.image || null,
      sourceUrl: recipe.sourceUrl || null,
    }));

  } catch (error) {
    console.error('Spoonacular API Error:', error);
    throw error;
  }
};