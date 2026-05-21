import { Types } from "mongoose";
import FoodEntry from "../models/FoodEntry.js";

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealBreakdown: {
    breakfast: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    lunch: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    dinner: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    snack: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
  };
  entries: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}

interface MealStats {
  _id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

interface OverallStats {
  _id: null;
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface WeeklySummary {
  dailyData: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  >;
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}

interface MonthlySummary {
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
  highestDay: number;
  daysTracked: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
  dailyData: Record<
    number,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  >;
}

export const getDailySummary = async (
  userId: string | Types.ObjectId,
  date: Date = new Date(),
): Promise<DailySummary> => {
  const startOfDay = new Date(date);

  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);

  endOfDay.setHours(23, 59, 59, 999);

  // conver user id to object id

  const userIdObjectId =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const [result] = await FoodEntry.aggregate<{
    mealStats: MealStats[];
    overallStats: OverallStats[];
  }>([
    // match the user id

    {
      $match: {
        userId: userIdObjectId,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      },
    },

    {
      $facet: {
        // meal stats

        mealStats: [
          {
            $group: {
              _id: "$mealType",
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],

        // overall stats

        overallStats: [
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],
      },
    },
  ]);

  // Initialize default summary structure
  const summary: DailySummary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealBreakdown: {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    },
    entries: 0,
    macros: {
      protein: { grams: 0, calories: 0, percentage: 0 },
      carbs: { grams: 0, calories: 0, percentage: 0 },
      fat: { grams: 0, calories: 0, percentage: 0 },
    },
  };

  // Populate overall stats

  if (result.overallStats.length > 0) {
    const overall = result.overallStats[0];

    summary.totalCalories = overall.totalCalories;
    summary.totalProtein = overall.totalProtein;
    summary.totalCarbs = overall.totalCarbs;
    summary.totalFat = overall.totalFat;
    summary.entries = overall.totalEntries;
  }

  // Populate meal breakdown

  console.log("result", result);

  result.mealStats.forEach((meal: any) => {
    console.log("meal", meal);
    const mealType = meal._id as keyof DailySummary["mealBreakdown"];
    if (summary.mealBreakdown[mealType]) {
      summary.mealBreakdown[mealType] = {
        calories: meal.totalCalories || 0,
        protein: meal.totalProtein || 0,
        carbs: meal.totalCarbs || 0,
        fat: meal.totalFat || 0,
        count: meal.totalEntries || 0,
      };
    }
  });

  //   Calcuate macros to calories

  const caloriesFromProtein = summary.totalProtein * 4;
  const caloriesFromCarbs = summary.totalCarbs * 4;
  const caloriesFromFat = summary.totalFat * 9;

  const totalMacrosCalories =
    caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

  summary.macros = {
    protein: {
      grams: summary.totalProtein,
      calories: caloriesFromProtein,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromProtein / totalMacrosCalories) * 100
          : 0,
    },
    carbs: {
      grams: summary.totalCarbs,
      calories: caloriesFromCarbs,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromCarbs / totalMacrosCalories) * 100
          : 0,
    },
    fat: {
      grams: summary.totalFat,
      calories: caloriesFromFat,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromFat / totalMacrosCalories) * 100
          : 0,
    },
  };
  return summary;
};

export const getWeeklySummary = async (
  userId: string | Types.ObjectId,
  startDate: Date,
  endDate: Date,
): Promise<WeeklySummary> => {
  const userIdObjectId =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const [result] = await FoodEntry.aggregate([
    {
      $match: {
        userId: userIdObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },

    {
      $facet: {

         // STAGE 2: $facet - Group by daily date and sum stats
        dailyStats: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              calories: { $sum: "$calories" },
              protein: { $sum: "$protein" },
              carbs: { $sum: "$carbs" },
              fat: { $sum: "$fat" },
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              _id: 1, // sort by date ascending
            },
          },
        ],
        // STAGE 3: $facet - Sum overall stats

        overallStats: [
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],
      },
    },
  ]);

  // FINAL RESULT STRUCTURE:

   // Transform dailyStats into an object keyed by date

  const dailyData: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  > = {};

   result.dailyStats.forEach((day:any) => {
    dailyData[day._id] = {
      calories: day.calories || 0,
      protein: day.protein || 0,
      carbs: day.carbs || 0,
      fat: day.fat || 0,
      count: day.count || 0,
    };
  });

    const overallStats = result.overallStats[0] || {
    totalEntries: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

// Calculate macros: convert grams to calories and calculate percentages
  const caloriesFromProtein = overallStats.totalProtein * 4;
  const caloriesFromCarbs = overallStats.totalCarbs * 4;
  const caloriesFromFat = overallStats.totalFat * 9;
  const totalMacroCalories =
    caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

    return {
    dailyData,
    totalEntries: overallStats.totalEntries,
    totalCalories: overallStats.totalCalories,
    totalProtein: overallStats.totalProtein,
    totalCarbs: overallStats.totalCarbs,
    totalFat: overallStats.totalFat,
    avgCalories:
      result.dailyStats.length > 0
        ? Math.round(overallStats.totalCalories / result.dailyStats.length)
        : 0,
    macros: {
      protein: {
        grams: overallStats.totalProtein,
        calories: caloriesFromProtein,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromProtein / totalMacroCalories) * 100
            : 0,
      },
      carbs: {
        grams: overallStats.totalCarbs,
        calories: caloriesFromCarbs,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromCarbs / totalMacroCalories) * 100
            : 0,
      },
      fat: {
        grams: overallStats.totalFat,
        calories: caloriesFromFat,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromFat / totalMacroCalories) * 100
            : 0,
      },
    },
  };


};

export const getMonthlySummary = async (
    userId: string | Types.ObjectId,
    year: number,
    month: number
  ): Promise<MonthlySummary> => {

     const startDate = new Date(year, month - 1, 1);

    // END DATE: Last day of the month (23:59:59.999)
     const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Convert userId to ObjectId if it's a string
    const userObjectId =
      typeof userId === "string" ? new Types.ObjectId(userId) : userId;

       const [result] = await FoodEntry.aggregate<{
         dailyStats: Array<{
        _id: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        count: number;
      }>;
      overallStats: OverallStats[];
      dailyTotals: Array<{
        _id: number;
        dayCalories: number;
      }>;
       }>([

         {
        $match: {
          userId: userObjectId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
               // OUTPUT after $sort: Same, but sorted by day number ascending
          dailyStats: [
            {
              $group: {
                _id: { $dayOfMonth: "$timestamp" },
                calories: { $sum: "$calories" },
                protein: { $sum: "$protein" },
                carbs: { $sum: "$carbs" },
                fat: { $sum: "$fat" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],

            overallStats: [
            {
              $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                totalCalories: { $sum: "$calories" },
                totalProtein: { $sum: "$protein" },
                totalCarbs: { $sum: "$carbs" },
                totalFat: { $sum: "$fat" },
              },
            },
          ],
            dailyTotals: [
            {
              $group: {
                _id: { $dayOfMonth: "$timestamp" },
                dayCalories: { $sum: "$calories" },
              },
            },
            { $sort: { dayCalories: -1 } },
            { $limit: 1 },
          ],
        }
      }
       ])

       // Transform dailyStats into dailyData object
    const dailyData: Record<
      number,
      {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        count: number;
      }
    > = {};

    result.dailyStats.forEach((day) => {
      dailyData[day._id] = {
        calories: day.calories,
        protein: day.protein,
        carbs: day.carbs,
        fat: day.fat,
        count: day.count,
      };
    });

      const overallStats = result.overallStats[0] || {
      totalEntries: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    
     const daysTracked = result.dailyStats.length;


      // avgCalories = total calories divided by number of days tracked
    // Example: 2600 total calories / 2 days = 1300 avg calories per day
    const avgCalories =
      daysTracked > 0 ? Math.round(overallStats.totalCalories / daysTracked) : 0;
    const highestDay = result.dailyTotals[0]?.dayCalories || 0;

     // Calculate macros: convert grams to calories and calculate percentages
    const caloriesFromProtein = overallStats.totalProtein * 4;
    const caloriesFromCarbs = overallStats.totalCarbs * 4;
    const caloriesFromFat = overallStats.totalFat * 9;
    const totalMacroCalories =
      caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

       return {
      totalEntries: overallStats.totalEntries,
      totalCalories: overallStats.totalCalories,
      totalProtein: overallStats.totalProtein,
      totalCarbs: overallStats.totalCarbs,
      totalFat: overallStats.totalFat,
      avgCalories,
      highestDay,
      daysTracked,
      macros: {
        protein: {
          grams: overallStats.totalProtein,
          calories: caloriesFromProtein,
          percentage:
            totalMacroCalories > 0
              ? Math.round((caloriesFromProtein / totalMacroCalories) * 100)
              : 0,
        },
        carbs: {
          grams: overallStats.totalCarbs,
          calories: caloriesFromCarbs,
          percentage:
            totalMacroCalories > 0
              ? Math.round((caloriesFromCarbs / totalMacroCalories) * 100)
              : 0,
        },
        fat: {
          grams: overallStats.totalFat,
          calories: caloriesFromFat,
          percentage:
            totalMacroCalories > 0
              ? Math.round((caloriesFromFat / totalMacroCalories) * 100)
              : 0,
        },
      },
      dailyData,
    };
  
  }
