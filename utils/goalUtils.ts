import { UserSettings, DEFAULT_GOAL_CATEGORIES, GoalCategoryId, GoalCategory } from '../types';

export interface GoalLabels {
  singular: string;
  plural: string;
  name: string;
  category: GoalCategory;
}

export const getGoalLabels = (settings: UserSettings): GoalLabels => {
  const category = DEFAULT_GOAL_CATEGORIES.find(c => c.id === settings.goalCategoryId) 
    || DEFAULT_GOAL_CATEGORIES[0];
  
  if (settings.goalCategoryId === 'custom' && settings.customGoalUnit) {
    return {
      singular: settings.customGoalUnit,
      plural: settings.customGoalUnitPlural || settings.customGoalUnit + 's',
      name: 'Custom Goal',
      category: {
        ...category,
        unit: settings.customGoalUnit,
        unitPlural: settings.customGoalUnitPlural || settings.customGoalUnit + 's',
      }
    };
  }
  
  return {
    singular: category.unit,
    plural: category.unitPlural,
    name: category.name,
    category
  };
};

export const formatGoalCount = (count: number, settings: UserSettings): string => {
  const labels = getGoalLabels(settings);
  return `${count} ${count === 1 ? labels.singular : labels.plural}`;
};
