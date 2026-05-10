export type Category = "food" | "feelings" | "actions" | "places" | "people";

export type WordCell = {
  kind: "word";
  emoji: string;
  label: string;
  category: Category;
};

export type FolderCell = {
  kind: "folder";
  emoji: string;
  label: string;
  boardId: string;
};

export type Cell = WordCell | FolderCell;

export interface Board {
  id: string;
  title: string;
  cells: Cell[];
}

export type BoardTree = Record<string, Board>;

export const ROOT_BOARD_ID = "root";

const word = (emoji: string, label: string, category: Category): WordCell => ({
  kind: "word",
  emoji,
  label,
  category,
});

const folder = (emoji: string, label: string, boardId: string): FolderCell => ({
  kind: "folder",
  emoji,
  label,
  boardId,
});

export const boards: BoardTree = {
  root: {
    id: "root",
    title: "Home",
    cells: [
      word("👤", "I", "people"),
      word("👉", "You", "people"),
      word("👋", "Want", "actions"),
      word("🙏", "Need", "actions"),
      word("👍", "Yes", "actions"),
      word("👎", "No", "actions"),
      word("🙋", "Help", "actions"),
      folder("🍎", "Food", "food"),
      folder("😊", "Feelings", "feelings"),
      folder("🚶", "Actions", "actions"),
      folder("🏠", "Places", "places"),
      folder("👫", "People", "people"),
    ],
  },
  food: {
    id: "food",
    title: "Food",
    cells: [
      word("💧", "Water", "food"),
      word("🥛", "Milk", "food"),
      word("🧃", "Juice", "food"),
      word("🍎", "Apple", "food"),
      word("🍌", "Banana", "food"),
      word("🍞", "Bread", "food"),
      word("🍕", "Pizza", "food"),
      word("🍪", "Cookie", "food"),
      word("🍚", "Rice", "food"),
      word("🥗", "Salad", "food"),
      word("🥪", "Sandwich", "food"),
      word("🍦", "Ice Cream", "food"),
    ],
  },
  feelings: {
    id: "feelings",
    title: "Feelings",
    cells: [
      word("😊", "Happy", "feelings"),
      word("😢", "Sad", "feelings"),
      word("😡", "Angry", "feelings"),
      word("😴", "Tired", "feelings"),
      word("😨", "Scared", "feelings"),
      word("🤢", "Sick", "feelings"),
      word("😇", "Good", "feelings"),
      word("💪", "Strong", "feelings"),
      word("🤗", "Hug", "feelings"),
      word("😤", "Frustrated", "feelings"),
      word("🥰", "Excited", "feelings"),
      word("😌", "Calm", "feelings"),
      word("❤️", "Love", "feelings"),
    ],
  },
  actions: {
    id: "actions",
    title: "Actions",
    cells: [
      word("👋", "Want", "actions"),
      word("🙏", "Need", "actions"),
      word("🚶", "Go", "actions"),
      word("🛑", "Stop", "actions"),
      word("👍", "Yes", "actions"),
      word("👎", "No", "actions"),
      word("🙋", "Help", "actions"),
      word("🎮", "Play", "actions"),
      word("📖", "Read", "actions"),
      word("✍️", "Write", "actions"),
      word("🍽️", "Eat", "actions"),
      word("🥤", "Drink", "actions"),
      word("😴", "Sleep", "actions"),
      word("🎵", "Music", "actions"),
      word("🖼️", "Look", "actions"),
      word("🤝", "Share", "actions"),
    ],
  },
  places: {
    id: "places",
    title: "Places",
    cells: [
      word("🏠", "Home", "places"),
      word("🏫", "School", "places"),
      word("🏥", "Hospital", "places"),
      word("🛒", "Store", "places"),
      word("🚽", "Bathroom", "places"),
      word("🛏️", "Bed", "places"),
      word("🌳", "Park", "places"),
      word("🚗", "Car", "places"),
      word("📺", "TV", "places"),
      word("🏖️", "Beach", "places"),
      word("✈️", "Airport", "places"),
      word("⛪", "Church", "places"),
    ],
  },
  people: {
    id: "people",
    title: "People",
    cells: [
      word("👤", "I", "people"),
      word("👉", "You", "people"),
      word("👩", "Mom", "people"),
      word("👨", "Dad", "people"),
      word("👫", "Friend", "people"),
      word("👶", "Baby", "people"),
      word("👴", "Grandpa", "people"),
      word("👵", "Grandma", "people"),
      word("👨‍⚕️", "Doctor", "people"),
      word("👩‍🏫", "Teacher", "people"),
      word("🐶", "Dog", "people"),
      word("🐱", "Cat", "people"),
      word("🧑", "Person", "people"),
    ],
  },
};

export const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  food: { bg: "bg-cat-food-bg", text: "text-cat-food", border: "border-cat-food/30" },
  feelings: { bg: "bg-cat-feelings-bg", text: "text-cat-feelings", border: "border-cat-feelings/30" },
  actions: { bg: "bg-cat-actions-bg", text: "text-cat-actions", border: "border-cat-actions/30" },
  places: { bg: "bg-cat-places-bg", text: "text-cat-places", border: "border-cat-places/30" },
  people: { bg: "bg-cat-people-bg", text: "text-cat-people", border: "border-cat-people/30" },
};

export const folderColors = {
  bg: "bg-secondary",
  text: "text-foreground",
  border: "border-primary/40",
};
