import HotKey

enum Quarter {
  case topLeft
  case topRight
  case bottomLeft
  case bottomRight
}

enum ScreenHalf {
  case top
  case bottom
  case left
  case right
}

class WindowManager {
  public static let sharedInstance = WindowManager()

  private let screenDetector = ScreenDetector()

  func moveHalf(_ half: ScreenHalf) {
    guard let frontmostWindowElement = AccessibilityElement.frontmostWindow()
    else {
      NSSound.beep()
      return
    }

    let screens = screenDetector.detectScreens(using: frontmostWindowElement)

    guard let usableScreens = screens else {
      NSSound.beep()
      print("Unable to obtain usable screens")
      return
    }

    let normalizedScreenFrame = AccessibilityElement.normalizeCoordinatesOf(usableScreens.frameOfCurrentScreen)

    var origin = CGPoint(x: normalizedScreenFrame.origin.x + normalizedScreenFrame.width / 2, y: normalizedScreenFrame.origin.y)
    var size = CGSize(width: normalizedScreenFrame.width / 2, height: normalizedScreenFrame.height)

    switch(half) {
      case .top:
        origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
        size = CGSize(width: normalizedScreenFrame.width, height: normalizedScreenFrame.height / 2)
      case .bottom:
        origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y + normalizedScreenFrame.size.height / 2)
        size = CGSize(width: normalizedScreenFrame.width, height: normalizedScreenFrame.height / 2)
      case .right:
        origin = CGPoint(x: normalizedScreenFrame.origin.x + normalizedScreenFrame.width / 2, y: normalizedScreenFrame.origin.y)
        size = CGSize(width: normalizedScreenFrame.width / 2, height: normalizedScreenFrame.height)
      case .left:
        origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
        size = CGSize(width: normalizedScreenFrame.width / 2, height: normalizedScreenFrame.height)
    }

    frontmostWindowElement.setRectOf(CGRect(origin: origin, size: size))
  }

  func moveQuarter(_ corner: Quarter) {
    guard let frontmostWindowElement = AccessibilityElement.frontmostWindow()
    else {
      NSSound.beep()
      return
    }

    let screens = screenDetector.detectScreens(using: frontmostWindowElement)

    guard let usableScreens = screens else {
      NSSound.beep()
      print("Unable to obtain usable screens")
      return
    }

    let normalizedScreenFrame = AccessibilityElement.normalizeCoordinatesOf(usableScreens.frameOfCurrentScreen)

    var origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
    switch(corner) {
      case .bottomLeft:
        origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y + normalizedScreenFrame.height / 2)
      case .bottomRight:
        origin = CGPoint(x: normalizedScreenFrame.origin.x + normalizedScreenFrame.width / 2, y: normalizedScreenFrame.origin.y + normalizedScreenFrame.height / 2)
      case .topLeft:
        origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
      case .topRight:
        origin = CGPoint(x: normalizedScreenFrame.origin.x + normalizedScreenFrame.width / 2, y: normalizedScreenFrame.origin.y)
    }
    let size = CGSize(width: normalizedScreenFrame.width / 2, height: normalizedScreenFrame.height / 2)

    frontmostWindowElement.setRectOf(CGRect(origin: origin, size: size))
  }

  func fullscreen() {
    guard let frontmostWindowElement = AccessibilityElement.frontmostWindow()
    else {
      NSSound.beep()
      return
    }

    let screens = screenDetector.detectScreens(using: frontmostWindowElement)

    guard let usableScreens = screens else {
      NSSound.beep()
      print("Unable to obtain usable screens")
      return
    }
    let normalizedScreenFrame = AccessibilityElement.normalizeCoordinatesOf(usableScreens.frameOfCurrentScreen)

    let origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
    let size = CGSize(width: normalizedScreenFrame.width, height: normalizedScreenFrame.height)

    frontmostWindowElement.setRectOf(CGRect(origin: origin, size: size))
  }

  func moveToNextScreen() {
    guard let frontmostWindowElement = AccessibilityElement.frontmostWindow()
    else {
      NSSound.beep()
      return
    }

    let screens = screenDetector.detectScreens(using: frontmostWindowElement)

    guard let usableScreens = screens else {
      NSSound.beep()
      print("Unable to obtain usable screens")
      return
    }

    guard let targetScreen = usableScreens.adjacentScreens?.next else {
      NSSound.beep()
      return
    }

    let normalizedScreenFrame = AccessibilityElement.normalizeCoordinatesOf(targetScreen.frame)

    let origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
    let size = CGSize(width: normalizedScreenFrame.width, height: normalizedScreenFrame.height)

    frontmostWindowElement.setRectOf(CGRect(origin: origin, size: size))
  }

  func moveToPrevScreen() {
    guard let frontmostWindowElement = AccessibilityElement.frontmostWindow()
    else {
      NSSound.beep()
      return
    }

    let screens = screenDetector.detectScreens(using: frontmostWindowElement)

    guard let usableScreens = screens else {
      NSSound.beep()
      print("Unable to obtain usable screens")
      return
    }

    guard let targetScreen = usableScreens.adjacentScreens?.prev else {
      NSSound.beep()
      return
    }

    let normalizedScreenFrame = AccessibilityElement.normalizeCoordinatesOf(targetScreen.frame)

    let origin = CGPoint(x: normalizedScreenFrame.origin.x, y: normalizedScreenFrame.origin.y)
    let size = CGSize(width: normalizedScreenFrame.width, height: normalizedScreenFrame.height)

    frontmostWindowElement.setRectOf(CGRect(origin: origin, size: size))
  }
}
