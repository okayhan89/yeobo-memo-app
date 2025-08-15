import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")
    
    Function("reloadAllTimelines") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
    
    Function("reloadTimelines") { (kind: String) in
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadTimelines(ofKind: kind)
      }
    }
  }
}