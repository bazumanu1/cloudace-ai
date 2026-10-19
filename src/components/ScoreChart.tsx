import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

type ScoreChartProps = {
  data: Array<{ name: string; score: number }>
}

export default function ScoreChart({ data }: ScoreChartProps) {
  return (
    <div className="chart-wrap" role="img" aria-label="Chart of quiz scores over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
          <defs><linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7068ed" stopOpacity={0.22} /><stop offset="92%" stopColor="#7068ed" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#ececf2" strokeDasharray="4 5" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9394a3', fontSize: 11 }} dy={10} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tick={{ fill: '#9394a3', fontSize: 11 }} />
          <Tooltip contentStyle={{ border: '1px solid #e8e8ef', borderRadius: 10, boxShadow: '0 8px 28px #26304a12', fontSize: 12 }} formatter={(value) => [`${value}%`, 'Score']} />
          <Area type="monotone" dataKey="score" stroke="#7168e8" strokeWidth={2.5} fill="url(#scoreGradient)" dot={{ r: 4, fill: '#7168e8', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
