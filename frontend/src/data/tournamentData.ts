import type { GroupData, GroupId, Team } from "@/types/tournament";
import { TEAM_DEFS } from "@/data/teamSquads";

// 5 groups × 4 teams = 20 teams → C(4,2) = 6 matches per group, zero duplicates
const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E"];
const TEAMS_PER_GROUP = 4;

export const buildGroupData = (): GroupData[] =>
  GROUP_IDS.map((gid, gIdx) => ({
    id: gid,
    label: `Group ${gid}`,
    teams: TEAM_DEFS.slice(gIdx * TEAMS_PER_GROUP, gIdx * TEAMS_PER_GROUP + TEAMS_PER_GROUP).map(
      (def, slotIdx) => ({
        id: `${gid}${slotIdx + 1}`,
        name: def.name,
        groupId: gid,
        slotIndex: slotIdx,
      } satisfies Team)
    ),
  }));

export const GROUPS: GroupData[] = buildGroupData();
