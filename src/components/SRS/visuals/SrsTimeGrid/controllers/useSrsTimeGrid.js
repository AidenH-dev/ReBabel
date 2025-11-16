/**
 * useSrsTimeGrid Hook (Controller)
 *
 * Manages the state and logic for the SRS Time Grid.
 * Handles:
 * - Calculating week days
 * - Managing current time
 * - Auto-scrolling to current hour
 * - Transforming API data
 */

import { useEffect, useState } from 'react';
import { getTodayStart } from '../models/srsFormatters';
import { transformApiItems } from '../models/srsDataModel';
import { formatTime } from '../models/srsFormatters';

/**
 * Hook to manage SRS Time Grid logic
 */
export function useSrsTimeGrid(initialItems = []) {
  const [weekStart] = useState(() => getTodayStart());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [items, setItems] = useState(initialItems);

  // Update current time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      const currentHour = new Date().getHours();
      const hourElements = document.querySelectorAll('[data-hour]');
      if (hourElements.length > currentHour) {
        const element = hourElements[currentHour];
        element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 500);

    return () => clearTimeout(scrollTimer);
  }, []);

  /**
   * Get all week days starting from today
   */
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  /**
   * Transform and set API items
   */
  const setApiItems = (apiItems) => {
    const transformedItems = transformApiItems(apiItems, formatTime);
    setItems(transformedItems);
  };

  return {
    items,
    currentTime,
    weekDays: getWeekDays(),
    setItems,
    setApiItems,
  };
}
