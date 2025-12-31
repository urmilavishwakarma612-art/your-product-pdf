import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DifficultyStats {
  difficulty: string;
  total: number;
  solved: number;
  solve_rate: number;
}

interface DifficultyChartProps {
  stats: DifficultyStats[];
}

const COLORS = {
  easy: "hsl(142, 76%, 36%)",
  medium: "hsl(45, 93%, 47%)",
  hard: "hsl(0, 84%, 60%)",
};

export function DifficultyChart({ stats }: DifficultyChartProps) {
  const chartData = stats.map((s) => ({
    name: s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1),
    difficulty: s.difficulty,
    solved: s.solved,
    unsolved: s.total - s.solved,
    total: s.total,
    rate: s.solve_rate,
  }));

  if (chartData.every((d) => d.total === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Solved: {data.solved} / {data.total}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {data.rate.toFixed(0)}% success rate
                  </p>
                </div>
              );
            }}
          />
          <Bar 
            dataKey="solved" 
            radius={[0, 4, 4, 0]}
            barSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.difficulty as keyof typeof COLORS]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6">
        {stats.map((s) => (
          <div key={s.difficulty} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[s.difficulty as keyof typeof COLORS] }}
            />
            <span className="text-sm capitalize">{s.difficulty}</span>
            <span className="text-sm text-muted-foreground">
              ({s.solve_rate.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
