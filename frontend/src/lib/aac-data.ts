export type Category = "food" | "feelings" | "actions" | "places" | "people";

export interface AACButton {
  emoji: string;
  label: string;
  category: Category;
}

export const aacButtons: AACButton[] = [
  // Row 1
  { emoji: "👤", label: "I", category: "people" },
  { emoji: "👉", label: "You", category: "people" },
  { emoji: "👋", label: "Want", category: "actions" },
  { emoji: "🙏", label: "Need", category: "actions" },
  { emoji: "💧", label: "Water", category: "food" },
  { emoji: "🍎", label: "Apple", category: "food" },
  { emoji: "😊", label: "Happy", category: "feelings" },
  { emoji: "😢", label: "Sad", category: "feelings" },
  { emoji: "🏠", label: "Home", category: "places" },
  { emoji: "🏫", label: "School", category: "places" },
  { emoji: "👩", label: "Mom", category: "people" },

  // Row 2
  { emoji: "👨", label: "Dad", category: "people" },
  { emoji: "👫", label: "Friend", category: "people" },
  { emoji: "🚶", label: "Go", category: "actions" },
  { emoji: "🛑", label: "Stop", category: "actions" },
  { emoji: "🍞", label: "Bread", category: "food" },
  { emoji: "🥛", label: "Milk", category: "food" },
  { emoji: "😡", label: "Angry", category: "feelings" },
  { emoji: "😴", label: "Tired", category: "feelings" },
  { emoji: "🏥", label: "Hospital", category: "places" },
  { emoji: "🛒", label: "Store", category: "places" },
  { emoji: "👶", label: "Baby", category: "people" },

  // Row 3
  { emoji: "❤️", label: "Love", category: "feelings" },
  { emoji: "👍", label: "Yes", category: "actions" },
  { emoji: "👎", label: "No", category: "actions" },
  { emoji: "🙋", label: "Help", category: "actions" },
  { emoji: "🍌", label: "Banana", category: "food" },
  { emoji: "🍕", label: "Pizza", category: "food" },
  { emoji: "😨", label: "Scared", category: "feelings" },
  { emoji: "🤢", label: "Sick", category: "feelings" },
  { emoji: "🚽", label: "Bathroom", category: "places" },
  { emoji: "🛏️", label: "Bed", category: "places" },
  { emoji: "👴", label: "Grandpa", category: "people" },

  // Row 4
  { emoji: "👵", label: "Grandma", category: "people" },
  { emoji: "🎮", label: "Play", category: "actions" },
  { emoji: "📖", label: "Read", category: "actions" },
  { emoji: "✍️", label: "Write", category: "actions" },
  { emoji: "🍪", label: "Cookie", category: "food" },
  { emoji: "🧃", label: "Juice", category: "food" },
  { emoji: "😇", label: "Good", category: "feelings" },
  { emoji: "💪", label: "Strong", category: "feelings" },
  { emoji: "🌳", label: "Park", category: "places" },
  { emoji: "🚗", label: "Car", category: "places" },
  { emoji: "👨‍⚕️", label: "Doctor", category: "people" },

  // Row 5
  { emoji: "👩‍🏫", label: "Teacher", category: "people" },
  { emoji: "🍽️", label: "Eat", category: "actions" },
  { emoji: "🥤", label: "Drink", category: "actions" },
  { emoji: "😴", label: "Sleep", category: "actions" },
  { emoji: "🍚", label: "Rice", category: "food" },
  { emoji: "🥗", label: "Salad", category: "food" },
  { emoji: "🤗", label: "Hug", category: "feelings" },
  { emoji: "😤", label: "Frustrated", category: "feelings" },
  { emoji: "📺", label: "TV", category: "places" },
  { emoji: "🏖️", label: "Beach", category: "places" },
  { emoji: "🐶", label: "Dog", category: "people" },

  // Row 6
  { emoji: "🐱", label: "Cat", category: "people" },
  { emoji: "🎵", label: "Music", category: "actions" },
  { emoji: "🖼️", label: "Look", category: "actions" },
  { emoji: "🤝", label: "Share", category: "actions" },
  { emoji: "🍦", label: "Ice Cream", category: "food" },
  { emoji: "🥪", label: "Sandwich", category: "food" },
  { emoji: "🥰", label: "Excited", category: "feelings" },
  { emoji: "😌", label: "Calm", category: "feelings" },
  { emoji: "✈️", label: "Airport", category: "places" },
  { emoji: "⛪", label: "Church", category: "places" },
  { emoji: "🧑", label: "Person", category: "people" },
];

export const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  food: { bg: "bg-cat-food-bg", text: "text-cat-food", border: "border-cat-food/30" },
  feelings: { bg: "bg-cat-feelings-bg", text: "text-cat-feelings", border: "border-cat-feelings/30" },
  actions: { bg: "bg-cat-actions-bg", text: "text-cat-actions", border: "border-cat-actions/30" },
  places: { bg: "bg-cat-places-bg", text: "text-cat-places", border: "border-cat-places/30" },
  people: { bg: "bg-cat-people-bg", text: "text-cat-people", border: "border-cat-people/30" },
};
