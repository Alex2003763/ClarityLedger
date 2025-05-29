
import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

// Icons moved here as they are specific to CategoryManager
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165M11.543 0a48.297 48.297 0 0 1-3.478-.397m-12.56 0a48.297 48.297 0 0 0-3.478-.397M9.75 4.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v.75H9.75v-.75Z" />
  </svg>
);

interface CategoryManagerProps {
  title: string;
  categories: string[];
  customCategories: string[];
  newCategory: string;
  setNewCategory: (val: string) => void;
  onAdd: () => void;
  onDelete: (name: string) => void;
  categoryTypeForTranslation: 'income' | 'expense';
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
    title, 
    categories, 
    customCategories, 
    newCategory, 
    setNewCategory, 
    onAdd, 
    onDelete, 
    categoryTypeForTranslation 
}) => {
  const { t } = useAppContext();

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <div className="mb-3 p-3 bg-gray-50 dark:bg-darkSurface/50 rounded-md">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('settingsPage.customCategories.defaultCategories')}</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
            const translated = t(key) === key ? cat : t(key);
            return (
              <span key={cat} className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md">
                {translated}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('settingsPage.customCategories.yourCustomCategories')}</h4>
        {customCategories.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('settingsPage.customCategories.noCustomYet')}</p>
        ) : (
          <ul className="space-y-1 max-h-32 overflow-y-auto pr-2">
            {customCategories.map(cat => (
              <li key={cat} className="flex justify-between items-center text-sm p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="text-gray-700 dark:text-gray-200">{cat}</span>
                <Button onClick={() => onDelete(cat)} variant="ghost" size="sm" className="p-1 text-danger hover:bg-red-100 dark:hover:bg-red-900/[0.5]">
                  <TrashIcon className="w-4 h-4"/>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex space-x-2">
        <Input
          id={`new-category-input-${categoryTypeForTranslation}`} // Stable ID
          key={`new-category-input-field-${categoryTypeForTranslation}`} // Stable key
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder={t('settingsPage.customCategories.addPlaceholder')}
          containerClassName="flex-grow mb-0"
          className="h-10"
          aria-label={t('settingsPage.customCategories.addPlaceholder')}
        />
        <Button onClick={onAdd} variant="secondary" size="md" className="h-10 px-3" leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
          {t('settingsPage.customCategories.addButton')}
        </Button>
      </div>
    </div>
  );
};

export default CategoryManager;
