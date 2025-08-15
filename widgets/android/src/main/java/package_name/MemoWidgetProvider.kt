package com.hanseungyeab.yeobomemoapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class MemoWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val SHARED_PREFS_NAME = "yeobo_memo_widget_prefs"
        private const val MEMO_DATA_KEY = "memo_data"
        private const val ACTION_OPEN_APP = "com.hanseungyeab.yeobomemoapp.OPEN_APP"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // 각 위젯 인스턴스를 업데이트
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        when (intent.action) {
            ACTION_OPEN_APP -> {
                // 메인 앱 열기
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
            }
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // 위젯 레이아웃 가져오기
        val views = RemoteViews(context.packageName, R.layout.memo_widget_layout)

        // SharedPreferences에서 메모 데이터 가져오기
        val memoData = getMemoData(context, appWidgetId)
        
        if (memoData != null) {
            // 메모 데이터로 위젯 업데이트
            updateWidgetWithMemoData(context, views, memoData)
        } else {
            // 기본 상태 표시
            updateWidgetWithDefaultData(views)
        }

        // 앱 열기 버튼 설정
        val openAppIntent = Intent(context, MemoWidgetProvider::class.java).apply {
            action = ACTION_OPEN_APP
        }
        val openAppPendingIntent = PendingIntent.getBroadcast(
            context, 
            appWidgetId, 
            openAppIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_open_app, openAppPendingIntent)

        // 위젯 전체 클릭으로도 앱 열기
        views.setOnClickPendingIntent(R.id.memo_items_container, openAppPendingIntent)

        // 위젯 업데이트
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateWidgetWithMemoData(context: Context, views: RemoteViews, memoData: JSONObject) {
        try {
            // 메모 제목 설정
            val title = memoData.optString("title", "제목 없음")
            views.setTextViewText(R.id.widget_title, title)

            // 메모 아이템들 설정
            val items = memoData.optJSONArray("items") ?: JSONArray()
            val maxItems = 3 // 위젯에 표시할 최대 아이템 수

            // 아이템 표시
            for (i in 0 until maxItems) {
                val itemViewId = when (i) {
                    0 -> R.id.memo_item_1
                    1 -> R.id.memo_item_2
                    2 -> R.id.memo_item_3
                    else -> continue
                }

                if (i < items.length()) {
                    val item = items.getJSONObject(i)
                    val itemName = item.optString("name", "")
                    val isChecked = item.optBoolean("checked", false)
                    
                    val displayText = if (isChecked) "✓ $itemName" else "• $itemName"
                    views.setTextViewText(itemViewId, displayText)
                    
                    // 완료된 아이템은 회색으로 표시
                    val textColor = if (isChecked) 0xFF6C757D.toInt() else 0xFF495057.toInt()
                    views.setTextColor(itemViewId, textColor)
                    
                    views.setViewVisibility(itemViewId, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(itemViewId, android.view.View.GONE)
                }
            }

            // 더 많은 아이템이 있는 경우 표시
            if (items.length() > maxItems) {
                val moreCount = items.length() - maxItems
                views.setTextViewText(R.id.memo_more_items, "+${moreCount}개 더...")
                views.setViewVisibility(R.id.memo_more_items, android.view.View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.memo_more_items, android.view.View.GONE)
            }

            // 업데이트 시간 설정
            val currentTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            views.setTextViewText(R.id.widget_last_updated, currentTime)

        } catch (e: Exception) {
            e.printStackTrace()
            updateWidgetWithDefaultData(views)
        }
    }

    private fun updateWidgetWithDefaultData(views: RemoteViews) {
        views.setTextViewText(R.id.widget_title, "메모를 추가해보세요")
        views.setTextViewText(R.id.memo_item_1, "• 위젯에서 메모를 확인하세요")
        views.setTextViewText(R.id.memo_item_2, "• 앱에서 메모를 생성하면")
        views.setTextViewText(R.id.memo_item_3, "• 자동으로 위젯에 표시됩니다")
        
        views.setViewVisibility(R.id.memo_item_1, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.memo_item_2, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.memo_item_3, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.memo_more_items, android.view.View.GONE)
        
        views.setTextViewText(R.id.widget_last_updated, "위젯 준비됨")
    }

    private fun getMemoData(context: Context, appWidgetId: Int): JSONObject? {
        val prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        val memoDataString = prefs.getString("${MEMO_DATA_KEY}_$appWidgetId", null)
        
        return try {
            if (memoDataString != null) JSONObject(memoDataString) else null
        } catch (e: Exception) {
            null
        }
    }

    // 앱에서 위젯 데이터를 업데이트할 때 사용할 정적 메서드
    companion object {
        fun updateWidgetData(context: Context, appWidgetId: Int, memoData: JSONObject) {
            val prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString("${MEMO_DATA_KEY}_$appWidgetId", memoData.toString())
                .apply()

            // 위젯 업데이트 트리거
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val intent = Intent(context, MemoWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
            }
            context.sendBroadcast(intent)
        }
    }
}