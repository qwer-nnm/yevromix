import { StyleSheet } from 'react-native';

export const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 98.63,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  activeTab: {
    // Стилі для активного табу тепер застосовуються динамічно
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 10,
    color: 'rgba(31, 31, 31, 1)',
    fontWeight: '400',
    fontFamily: 'Gotham Pro',
    lineHeight: 10,
    letterSpacing: 0,
  },
  activeLabel: {
    color: 'rgba(31, 31, 31, 1)',
    fontWeight: '400',
  },
});
