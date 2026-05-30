import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { LifeArea } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const AREA_COLORS: Record<string, string> = {
  health: '#22c55e', relationships: '#ec4899', career: '#3b82f6',
  finance: '#f59e0b', personal_growth: '#8b5cf6', fun: '#f97316',
  environment: '#14b8a6', learning: '#6366f1', contribution: '#a855f7',
};

function getScoreColor(score: number): string {
  if (score >= 8) return C.success;
  if (score >= 5) return C.warning;
  return C.danger;
}

// ─── Mini Radar Chart (visual) ───
function RadarChart({ scores, size = 200 }: { scores: Record<string, number>; size?: number }) {
  const areas = LIFE_AREAS;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 20;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background rings */}
      {[2, 4, 6, 8, 10].map(ring => (
        <View key={ring} style={{
          position: 'absolute', width: (ring / 10) * maxR * 2, height: (ring / 10) * maxR * 2,
          borderRadius: (ring / 10) * maxR, borderWidth: 1, borderColor: C.border + '60',
        }} />
      ))}
      {/* Area dots */}
      {areas.map((area, i) => {
        const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2;
        const score = scores[area.id] || 5;
        const r = (score / 10) * maxR;
        const x = cx + r * Math.cos(angle) - 12;
        const y = cy + r * Math.sin(angle) - 12;
        const color = AREA_COLORS[area.id] || C.primary;
        return (
          <View key={area.id} style={{
            position: 'absolute', left: x, top: y,
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: color + '40', alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: color,
          }}>
            <Text style={{ fontSize: 10 }}>{area.icon}</Text>
          </View>
        );
      })}
      {/* Center score */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: C.fg, fontSize: 22, fontWeight: 'bold' }}>
          {(Object.values(scores).reduce((s, v) => s + v, 0) / (Object.values(scores).length || 1)).toFixed(1)}
        </Text>
        <Text style={{ color: C.muted, fontSize: 10 }}>TB</Text>
      </View>
    </View>
  );
}

export default function LifeWheelScreen() {
  const lifeWheelScores = useLifeOSStore(s => s.lifeWheelScores);
  const addLifeWheelScore = useLifeOSStore(s => s.addLifeWheelScore);

  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);

  const currentScores = useMemo(() => {
    const sorted = [...lifeWheelScores].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    if (!latest) {
      const defaults: Record<string, number> = {};
      LIFE_AREAS.forEach(a => { defaults[a.id] = 5; });
      return defaults;
    }
    return latest.scores as Record<string, number>;
  }, [lifeWheelScores]);

  const avgScore = useMemo(() => {
    const values = Object.values(currentScores);
    return values.length > 0 ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1) : '0';
  }, [currentScores]);

  const lowAreas = useMemo(() => {
    return LIFE_AREAS
      .map(a => ({ ...a, score: currentScores[a.id] || 5 }))
      .filter(a => a.score < 5)
      .sort((a, b) => a.score - b.score);
  }, [currentScores]);

  const handleScoreChange = (area: LifeArea, score: number) => {
    const newScores = { ...currentScores, [area]: score } as Record<LifeArea, number>;
    addLifeWheelScore(newScores);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Life Wheel' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Radar Chart ── */}
          <View style={styles.chartContainer}>
            <RadarChart scores={currentScores} size={220} />
          </View>

          {/* ── Low Area Warning ── */}
          {lowAreas.length > 0 && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ Cần cải thiện</Text>
              <Text style={styles.warningText}>
                {lowAreas.map(a => `${a.icon} ${a.name} (${a.score})`).join(' · ')}
              </Text>
            </View>
          )}

          {/* ── Area List ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá theo lĩnh vực</Text>
            <Text style={styles.sectionHint}>Nhấn để chấm điểm 1–10</Text>
            {LIFE_AREAS.map(area => {
              const score = currentScores[area.id] || 5;
              const color = AREA_COLORS[area.id] || C.primary;
              const isSelected = selectedArea === area.id;

              return (
                <View key={area.id}>
                  <TouchableOpacity
                    style={[styles.areaRow, isSelected && styles.areaRowActive]}
                    onPress={() => setSelectedArea(isSelected ? null : area.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.areaIconBg, { backgroundColor: color + '20' }]}>
                      <Text style={styles.areaIcon}>{area.icon}</Text>
                    </View>
                    <View style={styles.areaInfo}>
                      <Text style={styles.areaName}>{area.name}</Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${score * 10}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) + '20' }]}>
                      <Text style={[styles.scoreBadgeText, { color: getScoreColor(score) }]}>{score}</Text>
                    </View>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.scoreSelector}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => handleScoreChange(area.id, n)}
                          style={[styles.scoreBtn, score === n && { backgroundColor: color, borderColor: color }]}
                        >
                          <Text style={[styles.scoreBtnText, score === n && { color: 'white' }]}>{n}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Chart ──
  chartContainer: { alignItems: 'center', paddingVertical: 20 },

  // ── Warning ──
  warningCard: {
    marginHorizontal: 20, marginBottom: 8, padding: 12,
    backgroundColor: C.danger + '15', borderRadius: 12,
    borderWidth: 1, borderColor: C.danger + '30',
  },
  warningTitle: { color: C.danger, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  warningText: { color: C.muted, fontSize: 12 },

  // ── Section ──
  section: { paddingHorizontal: 20 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600' },
  sectionHint: { color: C.muted, fontSize: 12, marginTop: 2, marginBottom: 12 },

  // ── Area Row ──
  areaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  areaRowActive: { backgroundColor: C.card, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  areaIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  areaIcon: { fontSize: 18 },
  areaInfo: { flex: 1 },
  areaName: { color: C.fg, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scoreBadgeText: { fontSize: 16, fontWeight: 'bold' },

  // ── Score Selector ──
  scoreSelector: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingVertical: 12, paddingLeft: 48,
  },
  scoreBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBtnText: { color: C.muted, fontSize: 14, fontWeight: '500' },
});
