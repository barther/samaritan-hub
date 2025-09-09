import { Home, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface ImpactProps {
  monthLabel: string;
  familiesThisMonth: number;
  peopleThisMonth: number;
  lastMonthFamilies?: number;
  lastMonthPeople?: number;
  totals?: { familiesAllTime?: number; peopleAllTime?: number };
}

const ImpactStrip = ({ 
  monthLabel, 
  familiesThisMonth, 
  peopleThisMonth, 
  lastMonthFamilies,
  lastMonthPeople,
  totals 
}: ImpactProps) => {
  const [animatedFamilies, setAnimatedFamilies] = useState(0);
  const [animatedPeople, setAnimatedPeople] = useState(0);

  useEffect(() => {
    if (familiesThisMonth > 0) {
      const timer = setTimeout(() => setAnimatedFamilies(familiesThisMonth), 200);
      return () => clearTimeout(timer);
    }
  }, [familiesThisMonth]);

  useEffect(() => {
    if (peopleThisMonth > 0) {
      const timer = setTimeout(() => setAnimatedPeople(peopleThisMonth), 400);
      return () => clearTimeout(timer);
    }
  }, [peopleThisMonth]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 sm:p-6">
      <div className="text-center">
        <p className="text-lg text-foreground mb-4">
          In <span className="font-semibold text-primary">{monthLabel}</span>, we helped{' '}
          <span className="font-semibold text-primary">
            {lastMonthFamilies || 0} {(lastMonthFamilies || 0) === 1 ? 'family' : 'families'}
          </span>{' '}
          and spoke with{' '}
          <span className="font-semibold text-primary">
            {lastMonthPeople || 0} {(lastMonthPeople || 0) === 1 ? 'person' : 'people'}
          </span>.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-50">
            <Home className="h-5 w-5 text-primary" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground transition-all duration-500">
                {familiesThisMonth > 0 ? animatedFamilies : familiesThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">
                Families this month
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-50">
            <Users className="h-5 w-5 text-primary" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground transition-all duration-500">
                {peopleThisMonth > 0 ? animatedPeople : peopleThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">
                People this month
              </div>
            </div>
          </div>
        </div>

        {/* All-time totals */}
        {totals && (totals.familiesAllTime || totals.peopleAllTime) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-muted-foreground">
              All-time: {totals.familiesAllTime || 0} families • {totals.peopleAllTime || 0} people
            </p>
          </div>
        )}

        {/* Zero state helper */}
        {familiesThisMonth === 0 && peopleThisMonth === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            Numbers update as the month progresses.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImpactStrip;