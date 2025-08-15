import WidgetKit
import SwiftUI

struct MemoWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> MemoEntry {
        MemoEntry(date: Date(), title: "메모 제목", items: ["할 일 1", "할 일 2", "할 일 3"])
    }

    func getSnapshot(in context: Context, completion: @escaping (MemoEntry) -> ()) {
        let entry = MemoEntry(date: Date(), title: "샘플 메모", items: ["샘플 할 일 1", "샘플 할 일 2"])
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // App Group을 통해 메모 데이터 읽기
        let userDefaults = UserDefaults(suiteName: "group.com.hanseungyeab.yeobomemoapp.widget")
        
        let title = userDefaults?.string(forKey: "widgetTitle") ?? "메모"
        let itemsData = userDefaults?.string(forKey: "widgetItems") ?? "[]"
        
        var items: [String] = []
        if let data = itemsData.data(using: .utf8) {
            do {
                items = try JSONSerialization.jsonObject(with: data, options: []) as? [String] ?? []
            } catch {
                print("Failed to parse widget items: \(error)")
            }
        }
        
        let currentDate = Date()
        let entry = MemoEntry(date: currentDate, title: title, items: items)
        
        // 15분 후 업데이트
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
}

struct MemoEntry: TimelineEntry {
    let date: Date
    let title: String
    let items: [String]
}

struct MemoWidgetEntryView : View {
    var entry: MemoWidgetProvider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 제목
            Text(entry.title)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
                .lineLimit(1)
            
            // 할 일 목록
            if entry.items.isEmpty {
                Text("할 일이 없습니다")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                ForEach(entry.items.prefix(5), id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(item)
                            .font(.caption)
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        Spacer()
                    }
                }
                
                if entry.items.count > 5 {
                    Text("+\(entry.items.count - 5)개 더...")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct MemoWidget: Widget {
    let kind: String = "MemoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MemoWidgetProvider()) { entry in
            MemoWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("메모 위젯")
        .description("메모의 할 일 목록을 확인하세요")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct MemoWidget_Previews: PreviewProvider {
    static var previews: some View {
        MemoWidgetEntryView(entry: MemoEntry(date: Date(), title: "샘플 메모", items: ["할 일 1", "할 일 2", "할 일 3"]))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}