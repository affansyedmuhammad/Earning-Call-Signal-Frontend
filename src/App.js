import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts';
import { FileText, Calendar, BarChart as LucideBarChart } from 'lucide-react';

const EarningsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedQuarter, setSelectedQuarter] = useState('2024Q3');
  const [sentimentData, setSentimentData] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const ticker = 'nvda';
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Sentiment API
        const sentRes = await fetch(`/analysis/${ticker}`);
        if (!sentRes.ok) throw new Error(`Sentiment API error: ${sentRes.status}`);
        const sentJson = await sentRes.json();
        
        // 2) Transcript API
        const transRes = await fetch(`/getTranscripts/${ticker}`);
        if (!transRes.ok) throw new Error(`Transcript API error: ${transRes.status}`);
        const transJson = await transRes.json();
        
        setSentimentData(sentJson);
        setTranscriptData(transJson);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  if (loading) return <div className="p-6">Loading analysis for {ticker.toUpperCase()}...</div>;
  if (error) return <div className="p-6 text-red-600">Error: We are facing an issue right now. Try again later.</div>;

  // Transform data for charts
  const chartData = Object.keys(sentimentData.signals).map(quarter => ({
    quarter,
    management_pos: Math.round(sentimentData.signals[quarter].management_sentiment.positive_avg * 100),
    qa_pos: Math.round(sentimentData.signals[quarter].qa_sentiment.positive_avg * 100),
    management_neu: Math.round(sentimentData.signals[quarter].management_sentiment.neutral_avg * 100),
    qa_neu: Math.round(sentimentData.signals[quarter].qa_sentiment.neutral_avg * 100),
    management_neg: Math.round(sentimentData.signals[quarter].management_sentiment.negative_avg * 100),
    qa_neg: Math.round(sentimentData.signals[quarter].qa_sentiment.negative_avg * 100)
  }));

  const qoqData = Object.keys(sentimentData.qoq_tone_change).map(period => ({
    period: period.replace('2024Q3_to_', '').replace('2024Q4_to_', '').replace('2025Q1_to_', '').replace('_to_', ' → '),
    fullPeriod: period.replace('_to_', ' → '),
    management: (sentimentData.qoq_tone_change[period].management_tone_shift).toFixed(6),
    qa: (sentimentData.qoq_tone_change[period].qa_tone_shift).toFixed(6)
  }));

  const currentData = sentimentData.signals[selectedQuarter];

  // Calculate overall tone
  const getOverallTone = (sentiment) => {
    const positive = sentiment.positive_avg;
    const negative = sentiment.negative_avg;
    const neutral = sentiment.neutral_avg;
    
    if (positive > negative && positive > neutral) return { tone: 'Positive', color: 'text-green-600', bg: 'bg-green-50' };
    if (negative > positive && negative > neutral) return { tone: 'Negative', color: 'text-red-600', bg: 'bg-red-50' };
    return { tone: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const managementTone = getOverallTone(currentData.management_sentiment);
  const qaTone = getOverallTone(currentData.qa_sentiment);

  const SentimentCard = ({ title, value, type }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{Math.round(value * 100)}%</div>
      <div className="text-xs text-gray-400 mt-1">
        {type === 'management' ? 'Leadership tone' : 'Q&A sentiment'}
      </div>
    </div>
  );

  const OverallToneCard = ({ title, tone, subtitle }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className={`text-2xl font-semibold ${tone.color}`}>{tone.tone}</div>
      <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
    </div>
  );

  const TranscriptSection = ({ title, items }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">{item.speaker}</div>
            <div className="text-gray-700 leading-relaxed  text-justify">{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Earnings Call Analysis</h1>
          <p className="text-gray-600 mt-1">AI Earnings Call Signal Extraction - NVIDIA</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('Analysis')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'Analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LucideBarChart className="w-4 h-4 inline mr-2" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'transcript'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Transcript
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Quarter Selector */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <select
                  id="quarter_id"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(sentimentData.signals).map(quarter => (
                    <option key={quarter} value={quarter}>{quarter}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
              <OverallToneCard
                title="Management Tone"
                tone={managementTone}
                subtitle="Overall sentiment"
              />
              <OverallToneCard
                title="Q&A Tone"
                tone={qaTone}
                subtitle="Overall sentiment"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 text-center gap-4 mb-8">
            <SentimentCard
                title="Management Positive"
                value={currentData.management_sentiment.positive_avg}
                type="management"
              />
              <SentimentCard
                title="Management Neutral"
                value={currentData.management_sentiment.neutral_avg}
                type="management"
              />
              <SentimentCard
                title="Management Negative"
                value={currentData.management_sentiment.negative_avg}
                type="management"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 text-center gap-4 mb-8">
            <SentimentCard
                title="Q&A Positive"
                value={currentData.qa_sentiment.positive_avg}
                type="qa"
              />
              <SentimentCard
                title="Q&A Neutral"
                value={currentData.qa_sentiment.neutral_avg}
                type="qa"
              />
              <SentimentCard
                title="Q&A Negative"
                value={currentData.qa_sentiment.negative_avg}
                type="qa"
              />
              </div>
              {/* Strategic Focuses */}
            <div className="bg-white rounded-lg p-6 shadow-sm text-center border gap-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 ">Strategic Focus Areas</h3>
              {currentData.strategic_focuses.length > 0 ? (
                <div className="flex flex-wrap gap-2  justify-center text-center">
                  {currentData.strategic_focuses.map((focus, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm text-center"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No strategic focuses reported for this quarter </p>
              )}
            </div>
          </>
        )}
        {/*Analysis Tab */}
        {activeTab === 'Analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends - Positive</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="quarter" stroke="#6b7280" tickMargin={15} />
                <YAxis stroke="#6b7280" 
                 tickFormatter={val => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="management_pos"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Management"
                />
                <Line
                  type="monotone"
                  dataKey="qa_pos"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
                <Line
                  type="monotone"
                  dataKey="qa"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Q&A</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends - Neutral</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="quarter" stroke="#6b7280" tickMargin={15} />
                <YAxis stroke="#6b7280" 
                 tickFormatter={val => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="management_neu"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Management"
                />
                <Line
                  type="monotone"
                  dataKey="qa_neu"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
                <Line
                  type="monotone"
                  dataKey="qa"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Q&A</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends - Negative</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="quarter" stroke="#6b7280" tickMargin={15}/>
                <YAxis stroke="#6b7280" 
                 tickFormatter={val => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="management_neg"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Management"
                />
                <Line
                  type="monotone"
                  dataKey="qa_neg"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
                <Line
                  type="monotone"
                  dataKey="qa"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Q&A"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Q&A</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarter-over-Quarter Tone Changes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qoqData}>
              <XAxis dataKey="period" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value}`]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullPeriod;
                  }
                  return label;
                }}
              />
              <Bar dataKey="management" fill="#3b82f6" name="Management" radius={[2, 2, 0, 0]} />
              <Bar dataKey="qa" fill="#10b981" name="Q&A" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Q&A</span>
            </div>
          </div>
        </div>
        </div>
          
        )}

        {/*Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-semibold text-gray-900">
                Earnings Call - {transcriptData[selectedQuarter].date}
              </span>
            </div>

            <TranscriptSection
              title="Prepared Remarks"
              items={transcriptData[selectedQuarter].preparedRemarks}
            />

            <TranscriptSection
              title="Q&A Session"
              items={transcriptData[selectedQuarter].qanda}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default EarningsDashboard;