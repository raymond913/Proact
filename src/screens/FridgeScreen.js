// src/screens/FridgeScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Modal, Image, Animated, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../theme/colors';
import { searchRecipesByIngredients } from '../api/spoonacular';
import { useAppContext } from '../context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ALL_INGREDIENTS = [
  'Chicken', 'Chicken Breast', 'Chicken Thighs', 'Chicken Wings',
  'Beef', 'Ground Beef', 'Steak', 'Ribeye', 'Sirloin',
  'Pork', 'Pork Chops', 'Bacon', 'Ham', 'Sausage',
  'Salmon', 'Tuna', 'Shrimp', 'Tilapia', 'Cod',
  'Eggs', 'Egg Whites',
  'Rice', 'White Rice', 'Brown Rice',
  'Pasta', 'Spaghetti', 'Penne', 'Linguine',
  'Bread', 'Sourdough', 'Bagel', 'Tortilla',
  'Broccoli', 'Spinach', 'Kale', 'Lettuce', 'Arugula',
  'Tomato', 'Cherry Tomato',
  'Onion', 'Red Onion', 'Green Onion', 'Shallot',
  'Garlic', 'Ginger',
  'Bell Pepper', 'Jalapeño', 'Chili Pepper',
  'Mushroom', 'Portobello', 'Shiitake',
  'Potato', 'Sweet Potato',
  'Carrot', 'Celery', 'Cucumber', 'Zucchini',
  'Avocado', 'Lemon', 'Lime', 'Orange',
  'Cheese', 'Cheddar', 'Mozzarella', 'Parmesan', 'Feta',
  'Milk', 'Heavy Cream', 'Butter', 'Greek Yogurt',
  'Olive Oil', 'Vegetable Oil', 'Coconut Oil',
  'Soy Sauce', 'Hot Sauce', 'Worcestershire Sauce',
  'Salt', 'Black Pepper', 'Paprika', 'Cumin', 'Oregano',
  'Flour', 'Cornstarch', 'Baking Powder',
  'Beans', 'Black Beans', 'Chickpeas', 'Lentils',
  'Corn', 'Peas', 'Edamame',
];

const QUICK_ADD = ['Chicken', 'Rice', 'Eggs', 'Pasta', 'Broccoli', 'Tomato', 'Garlic', 'Onion', 'Beef', 'Salmon', 'Spinach', 'Cheese'];

const CUISINES = ['Any', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian'];
const DIETS    = ['Any', 'Vegetarian', 'Vegan', 'Gluten Free'];

// ── Recipe Sheet ──────────────────────────────────────────────────────────────
function RecipeSheet({ visible, recipes, onClose, onSelect }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[sheet.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={sheet.handle} />

          <View style={sheet.header}>
            <View>
              <Text style={sheet.title}>{recipes.length} recipes found</Text>
              <Text style={sheet.subtitle}>Tap to add to today's plan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7}>
              <Text style={sheet.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={sheet.list} showsVerticalScrollIndicator={false}>
            {recipes.map(recipe => (
              <TouchableOpacity key={recipe.id} style={sheet.card} onPress={() => onSelect(recipe)} activeOpacity={0.85}>
                {recipe.image ? (
                  <Image source={{ uri: recipe.image }} style={sheet.image} resizeMode="cover" />
                ) : (
                  <View style={sheet.imagePlaceholder}>
                    <Text style={sheet.imagePlaceholderText}>🍽️</Text>
                  </View>
                )}
                <View style={sheet.cardBody}>
                  <View style={sheet.cardMeta}>
                    <Text style={sheet.cardMetaText}>RECIPE</Text>
                    <Text style={sheet.cardMetaText}>{recipe.prepTime} min</Text>
                  </View>
                  <Text style={sheet.cardName} numberOfLines={2}>{recipe.name}</Text>
                  <Text style={sheet.cardDesc} numberOfLines={2}>{recipe.description}</Text>
                  <View style={sheet.chips}>
                    {recipe.ingredients.slice(0, 3).map((ing, i) => (
                      <View key={i} style={sheet.chip}>
                        <Text style={sheet.chipText}>{ing}</Text>
                      </View>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <View style={sheet.chip}>
                        <Text style={sheet.chipText}>+{recipe.ingredients.length - 3}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={sheet.addBtn} onPress={() => onSelect(recipe)} activeOpacity={0.8}>
                    <Text style={sheet.addBtnText}>Add to today's plan</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function FridgeScreen() {
  const { updateTodayMeal } = useAppContext();
  const [inputText, setInputText]   = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showSheet, setShowSheet]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cuisine, setCuisine] = useState('Any');
  const [diet, setDiet] = useState('Any');

  const handleInputChange = (text) => {
    setInputText(text);
    if (text.length >= 2) {
      setSuggestions(
        ALL_INGREDIENTS.filter(i => i.toLowerCase().startsWith(text.toLowerCase()) && !ingredients.includes(i)).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const addIngredient = (ing) => {
    if (!ing.trim() || ingredients.includes(ing.trim()) || ingredients.length >= 8) return;
    setIngredients([...ingredients, ing.trim()]);
    setInputText('');
    setSuggestions([]);
  };

  const removeIngredient = (ing) => setIngredients(ingredients.filter(i => i !== ing));

  const handleSelect = (recipe) => {
    setShowSheet(false);
    updateTodayMeal(recipe);
    Alert.alert('Added to plan', `${recipe.name} is now on your Today tab.`, [{ text: 'OK' }]);
  };

  const handleFind = async () => {
    if (ingredients.length < 2) {
      Alert.alert('Add more ingredients', 'You need at least 2 ingredients.');
      return;
    }
    setLoading(true);
    try {
      const results = await searchRecipesByIngredients(ingredients, {
      cuisine: cuisine !== 'Any' ? cuisine : '',
      diet: diet !== 'Any' ? diet : '',
    });
      if (!results.length) {
        Alert.alert('No recipes found', 'Try different ingredients.');
      } else {
        setRecipes(results);
        setShowSheet(true);
      }
    } catch {
      Alert.alert('Error', 'Could not fetch recipes. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIngredients([]);
    setInputText('');
    setSuggestions([]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Fridge</Text>
          <Text style={styles.subtitle}>What do you have?</Text>
        </View>

        {/* Search input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADD INGREDIENTS</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Type an ingredient..."
              placeholderTextColor={colors.muted}
              onSubmitEditing={() => addIngredient(inputText)}
              returnKeyType="done"
              autoCorrect={false}
              autoComplete="off"
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => addIngredient(inputText)} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Autocomplete */}
          {suggestions.length > 0 && (
            <View style={styles.dropdown}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.dropdownRow, i < suggestions.length - 1 && styles.dropdownRowBorder]}
                  onPress={() => addIngredient(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownText}>{s}</Text>
                  <Text style={styles.dropdownAdd}>+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick add */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ADD</Text>
          <View style={styles.chips}>
            {QUICK_ADD.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, ingredients.includes(s) && styles.chipActive]}
                onPress={() => addIngredient(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, ingredients.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>IN MY FRIDGE</Text>
              <Text style={styles.sectionCount}>{ingredients.length}/8</Text>
            </View>
            <View style={styles.chips}>
              {ingredients.map(ing => (
                <TouchableOpacity key={ing} style={styles.ingTag} onPress={() => removeIngredient(ing)} activeOpacity={0.7}>
                  <Text style={styles.ingTagText}>{ing}</Text>
                  <Text style={styles.ingTagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FILTERS</Text>

          <Text style={styles.filterSubLabel}>Cuisine</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            {CUISINES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.filterChip, cuisine === c && styles.filterChipActive]}
                onPress={() => setCuisine(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, cuisine === c && styles.filterChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterSubLabel, { marginTop: 12 }]}>Diet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            {DIETS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.filterChip, diet === d && styles.filterChipActive]}
                onPress={() => setDiet(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, diet === d && styles.filterChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Find recipes button */}
        <TouchableOpacity
          style={[styles.findBtn, ingredients.length < 2 && styles.findBtnDisabled]}
          onPress={handleFind}
          disabled={loading || ingredients.length < 2}
          activeOpacity={0.85}
        >
          {loading
            ? <View style={styles.loadingRow}><ActivityIndicator color="#fff" size="small" /><Text style={styles.findBtnText}>Finding recipes...</Text></View>
            : <Text style={styles.findBtnText}>Find Recipes</Text>
          }
        </TouchableOpacity>

        {ingredients.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Clear all</Text>
          </TouchableOpacity>
        )}

        {ingredients.length < 2 && (
          <Text style={styles.hint}>Add at least 2 ingredients to find recipes</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <RecipeSheet visible={showSheet} recipes={recipes} onClose={() => setShowSheet(false)} onSelect={handleSelect} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -1, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.subtext },

  section: { marginBottom: 24, zIndex: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.8, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionCount: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  dropdown: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  dropdownRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  dropdownAdd: { fontSize: 18, color: colors.primary, fontWeight: '700' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.subtext },
  chipTextActive: { color: '#fff' },

  ingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  ingTagText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  ingTagRemove: { fontSize: 16, color: colors.primary, lineHeight: 18 },

  findBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  findBtnDisabled: { backgroundColor: colors.border },
  findBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  clearBtn: { alignItems: 'center', paddingVertical: 10 },
  clearBtnText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 4 },

  filterSubLabel: { fontSize: 12, fontWeight: '600', color: colors.subtext, marginBottom: 8 },
  filterScroll: { marginHorizontal: -4 },
  filterRow: { gap: 8, paddingHorizontal: 4 },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.subtext },
  filterChipTextActive: { color: '#FFFFFF' },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  closeBtn: { paddingVertical: 4, paddingLeft: 16 },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  list: { paddingHorizontal: 20 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { width: '100%', height: 120, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 40 },
  cardBody: { padding: 16 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardMetaText: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.8 },
  cardName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6, letterSpacing: -0.3 },
  cardDesc: { fontSize: 13, color: colors.subtext, lineHeight: 19, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 12, color: colors.subtext, fontWeight: '500' },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
