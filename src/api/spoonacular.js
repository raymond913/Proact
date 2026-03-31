// src/api/spoonacular.js
const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY;
const BASE_URL = 'https://api.spoonacular.com';

/**
 * Search for recipes by ingredients with optional cuisine and diet filters.
 * Uses complexSearch so filters and recipe details come in a single API call.
 */
export const searchRecipesByIngredients = async (ingredients, { cuisine = '', diet = '' } = {}) => {
  try {
    const ingredientString = encodeURIComponent(ingredients.join(','));
    let url =
      `${BASE_URL}/recipes/complexSearch` +
      `?includeIngredients=${ingredientString}` +
      `&number=10` +
      `&maxReadyTime=45` +
      `&addRecipeInformation=true` +
      `&sort=min-missing-ingredients` +
      `&apiKey=${API_KEY}`;

    if (cuisine) url += `&cuisine=${encodeURIComponent(cuisine)}`;
    if (diet)    url += `&diet=${encodeURIComponent(diet)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const results = data.results || [];

    if (!results.length) return [];

    return results.map(recipe => ({
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
